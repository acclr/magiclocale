import type { NextApiRequest, NextApiResponse } from 'next';

import { PublicSdkAuthError } from '@/lib/api/public-sdk-auth';
import { authenticatePublicSdkApiRequest } from '@/lib/api/public-sdk-auth-prisma';
import { applyPublicSdkCors } from '@/lib/api/public-sdk-cors-prisma';
import { getEnvironmentService, getVersionService } from '@/lib/translations';
import { toPublicFlagPayload } from '@/lib/flags/flag-payload';

/**
 * Ruleset for one environment, evaluated locally by the SDK.
 *
 * SERVER_ONLY flags are stripped here: their targeting rules can contain
 * user attributes that must not reach a browser. Those are resolved through
 * the evaluate endpoint instead.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cors = await applyPublicSdkCors(req, res);
  if (cors !== 'continue') {
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const projectId = getSingleQueryValue(req.query.projectId);
  if (!projectId) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  try {
    const { environmentRef } = await authenticatePublicSdkApiRequest(
      req.headers.authorization,
      projectId,
      getSingleQueryValue(req.query.environment)
    );

    const environment = await getEnvironmentService().resolve(
      projectId,
      environmentRef
    );
    const { flags, version } =
      await getVersionService().resolveFlags(environment.id);
    const payload = toPublicFlagPayload(flags);

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader(
      'ETag',
      `"${environment.slug}:${version ? version.number : 'draft'}:flags"`
    );
    return res.status(200).json({
      projectId,
      environment: environment.slug,
      version: version ? String(version.number) : 'draft',
      versionNumber: version?.number ?? null,
      flags: payload,
    });
  } catch (error) {
    if (error instanceof PublicSdkAuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Unable to load feature flags.', error);
    return res.status(500).json({ error: 'Unable to load feature flags.' });
  }
}

function getSingleQueryValue(value: string | string[] | undefined) {
  return typeof value === 'string' && value ? value : null;
}

