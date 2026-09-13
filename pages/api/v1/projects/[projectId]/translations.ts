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
  getTranslationRepository,
  getVersionService,
} from '@/lib/translations';
import {
  buildTranslationBundle,
  type TranslationBundleFailure,
} from '@/lib/translations/translation-bundle';

const FAILURE_STATUS: Record<TranslationBundleFailure, number> = {
  'project-not-found': 404,
  'environment-not-found': 404,
  'locale-not-configured': 422,
  'version-not-found': 404,
};

const FAILURE_MESSAGE: Record<TranslationBundleFailure, string> = {
  'project-not-found': 'Project not found.',
  'environment-not-found': 'Environment not found.',
  'locale-not-configured': 'Locale is not configured for this project.',
  'version-not-found': 'Version not found.',
};

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

  const requestedVersion = parseVersion(req.query.version);
  if (requestedVersion === 'invalid') {
    return res
      .status(422)
      .json({ error: 'The version query parameter must be a number.' });
  }

  try {
    const { environmentRef } = await authenticatePublicSdkApiRequest(
      req.headers.authorization,
      projectId,
      getSingleQueryValue(req.query.environment)
    );

    const result = await buildTranslationBundle(
      {
        repository: getTranslationRepository(),
        environmentService: getEnvironmentService(),
        versionService: getVersionService(),
      },
      { projectId, locale, environment: environmentRef, version: requestedVersion }
    );
    if (!result.success) {
      return res
        .status(FAILURE_STATUS[result.reason])
        .json({ error: FAILURE_MESSAGE[result.reason] });
    }

    // A pinned version is immutable, so it can be cached hard. The live
    // pointer can move at any publish, so it must always be revalidated.
    if (requestedVersion !== null && result.bundle.versionNumber !== null) {
      res.setHeader(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
    res.setHeader(
      'ETag',
      `"${result.bundle.environment}:${result.bundle.version}:${locale}"`
    );
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

function parseVersion(
  value: string | string[] | undefined
): number | null | 'invalid' {
  const raw = getSingleQueryValue(value);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 'invalid';
  }
  return parsed;
}

function setHeaders(
  res: NextApiResponse,
  headers: Record<string, string>
): void {
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
}
