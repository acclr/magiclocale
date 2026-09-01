import type { NextApiRequest, NextApiResponse } from 'next';

import { PublicSdkAuthError } from '@/lib/api/public-sdk-auth';
import { authenticatePublicSdkApiRequest } from '@/lib/api/public-sdk-auth-prisma';
import {
  corsHeaders,
  getPublicSdkCorsPolicy,
  isAllowedOrigin,
} from '@/lib/api/public-sdk-cors';
import { getTranslationRepository } from '@/lib/translations';
import { buildTranslationBundle } from '@/lib/translations/translation-bundle';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const policy = getPublicSdkCorsPolicy();
  const origin =
    typeof req.headers.origin === 'string' ? req.headers.origin : null;
  const headers = corsHeaders(origin, policy);
  setHeaders(res, headers);

  if (!isAllowedOrigin(origin, policy)) {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
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

  const locale = getSingleQueryValue(req.query.locale)?.trim();
  if (!locale) {
    return res
      .status(422)
      .json({ error: 'A locale query parameter is required.' });
  }

  try {
    await authenticatePublicSdkApiRequest(req.headers.authorization, projectId);

    const result = await buildTranslationBundle(
      getTranslationRepository(),
      projectId,
      locale
    );
    if (!result.success) {
      const projectMissing = result.reason === 'project-not-found';
      return res.status(projectMissing ? 404 : 422).json({
        error: projectMissing
          ? 'Project not found.'
          : 'Locale is not configured for this project.',
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('ETag', `"${result.bundle.version}"`);
    return res.status(200).json(result.bundle);
  } catch (error) {
    if (error instanceof PublicSdkAuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Unable to load translations.', error);
    return res.status(500).json({ error: 'Unable to load translations.' });
  }
}

function getSingleQueryValue(value: string | string[] | undefined) {
  return typeof value === 'string' && value ? value : null;
}

function setHeaders(
  res: NextApiResponse,
  headers: Record<string, string>
): void {
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
}
