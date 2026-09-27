import type { NextApiRequest, NextApiResponse } from 'next';

import { PublicSdkAuthError } from '@/lib/api/public-sdk-auth';
import { authenticatePublicSdkApiRequest } from '@/lib/api/public-sdk-auth-prisma';
import { applyPublicSdkCors } from '@/lib/api/public-sdk-cors-prisma';
import { servePublicTranslation } from '@/lib/api/serve-public-content';
import {
  getEnvironmentService,
  getTranslationRepository,
  getVersionService,
} from '@/lib/translations';
import {
  buildTranslationCatalog,
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

  const locale = getSingleQueryValue(req.query.locale)?.trim() ?? null;
  const requestedVersion = parseVersion(req.query.version);
  if (requestedVersion === 'invalid') {
    return res
      .status(422)
      .json({ error: 'The version query parameter must be a number.' });
  }

  try {
    const environment = getSingleQueryValue(req.query.environment);

    if (!locale) {
      const { environmentRef } = await authenticatePublicSdkApiRequest(
        req.headers.authorization,
        projectId,
        environment
      );
      const catalog = await buildTranslationCatalog(
        {
          repository: getTranslationRepository(),
          environmentService: getEnvironmentService(),
          versionService: getVersionService(),
        },
        {
          projectId,
          environment: environmentRef,
          version: requestedVersion,
        }
      );
      if (!catalog.success) {
        return res
          .status(FAILURE_STATUS[catalog.reason])
          .json({ error: FAILURE_MESSAGE[catalog.reason] });
      }
      res.setHeader('Cache-Control', 'private, no-cache');
      return res.status(200).json(catalog.catalog);
    }

    const served = await servePublicTranslation({
      authorization: req.headers.authorization,
      projectId,
      locale,
      environment,
      version: requestedVersion,
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
