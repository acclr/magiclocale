import type { NextApiRequest, NextApiResponse } from 'next';

import { PublicSdkAuthError } from '@/lib/api/public-sdk-auth';
import { authenticatePublicSdkApiRequest } from '@/lib/api/public-sdk-auth-prisma';
import {
  corsHeaders,
  getPublicSdkCorsPolicy,
  isAllowedOrigin,
} from '@/lib/api/public-sdk-cors';
import {
  getEnvironmentService,
  getTranslationService,
} from '@/lib/translations';
import { parseSourceKeyPayload } from '@/lib/translations/source-key-payload';

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

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const projectId = getProjectId(req);
  if (!projectId) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  try {
    const { environmentRef } = await authenticatePublicSdkApiRequest(
      req.headers.authorization,
      projectId,
      getSingleQueryValue(req.query.environment)
    );

    const parsed = parseSourceKeyPayload(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error });
    }

    // Discovered keys land in the working copy of the environment the calling
    // app belongs to, so a staging build cannot alter what production serves.
    const environment = await getEnvironmentService().resolve(
      projectId,
      environmentRef
    );
    const result = await getTranslationService().syncFromSource(
      projectId,
      environment.id,
      parsed.keys
    );
    return res.status(200).json({ ...result, environment: environment.slug });
  } catch (error) {
    if (error instanceof PublicSdkAuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Unable to sync translation keys.', error);
    return res.status(500).json({ error: 'Unable to sync translation keys.' });
  }
}

function getProjectId(req: NextApiRequest): string | null {
  return getSingleQueryValue(req.query.projectId);
}

function getSingleQueryValue(
  value: string | string[] | undefined
): string | null {
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
