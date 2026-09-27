import type { NextApiRequest, NextApiResponse } from 'next';

import { PublicSdkAuthError } from '@/lib/api/public-sdk-auth';
import { applyPublicSdkCors } from '@/lib/api/public-sdk-cors-prisma';
import { servePublicFlags } from '@/lib/api/serve-public-content';

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
    const served = await servePublicFlags({
      authorization: req.headers.authorization,
      projectId,
      environment: getSingleQueryValue(req.query.environment),
      ifNoneMatch: req.headers['if-none-match'],
    });
    if (served.kind === 'error') {
      return res.status(served.status).json({ error: served.error });
    }
    res.setHeader('Cache-Control', served.cacheControl);
    res.setHeader('ETag', served.etag);
    if (served.kind === 'not-modified') {
      return res.status(304).end();
    }
    return res.status(200).json(served.body);
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
