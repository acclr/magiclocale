import type { NextApiRequest, NextApiResponse } from 'next';

import { PublicSdkAuthError } from '@/lib/api/public-sdk-auth';
import { authenticatePublicSdkApiRequest } from '@/lib/api/public-sdk-auth-prisma';
import {
  corsHeaders,
  getPublicSdkCorsPolicy,
  isAllowedOrigin,
} from '@/lib/api/public-sdk-cors';
import { getTranslationService } from '@/lib/translations';
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
    await authenticatePublicSdkApiRequest(req.headers.authorization, projectId);

    const parsed = parseSourceKeyPayload(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error });
    }

    const result = await getTranslationService().syncFromSource(
      projectId,
      parsed.keys
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof PublicSdkAuthError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Unable to sync translation keys.', error);
    return res.status(500).json({ error: 'Unable to sync translation keys.' });
  }
}

function getProjectId(req: NextApiRequest): string | null {
  return typeof req.query.projectId === 'string' && req.query.projectId
    ? req.query.projectId
    : null;
}

function setHeaders(
  res: NextApiResponse,
  headers: Record<string, string>
): void {
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
}
