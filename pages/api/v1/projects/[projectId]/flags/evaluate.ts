import type { NextApiRequest, NextApiResponse } from 'next';

import { evaluateFlag, type FlagEvaluationContext } from '@/domain/flags';
import { PublicSdkAuthError } from '@/lib/api/public-sdk-auth';
import { authenticatePublicSdkApiRequest } from '@/lib/api/public-sdk-auth-prisma';
import { applyPublicSdkCors } from '@/lib/api/public-sdk-cors-prisma';
import { getEnvironmentService, getVersionService } from '@/lib/translations';
import { findFlag } from '@/lib/flags/flag-payload';
import { evaluateFlagsSchema, validateWithSchema } from '@/lib/zod';

/**
 * Server-side evaluation. Returns resolved values only, never the rules, so
 * it is the safe way to read `server-only` flags and the way non-browser
 * callers avoid pulling a whole ruleset.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const cors = await applyPublicSdkCors(req, res);
  if (cors !== 'continue') {
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const projectId = getSingleQueryValue(req.query.projectId);
  if (!projectId) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  try {
    const payload = validateWithSchema(evaluateFlagsSchema, req.body ?? {});
    const { environmentRef } = await authenticatePublicSdkApiRequest(
      req.headers.authorization,
      projectId,
      payload.environment ?? getSingleQueryValue(req.query.environment)
    );

    const environment = await getEnvironmentService().resolve(
      projectId,
      environmentRef
    );
    const { flags, version } = await getVersionService().resolveFlags(
      environment.id
    );

    const context: FlagEvaluationContext = {
      key: payload.context?.key ?? null,
      attributes: payload.context?.attributes,
    };
    const requestedKeys = payload.keys?.length
      ? payload.keys
      : flags.flags.map((flag) => flag.key);

    const evaluations = requestedKeys.map((key) => {
      const evaluation = evaluateFlag(findFlag(flags, key), context);
      return {
        key,
        value: evaluation.value,
        reason: evaluation.reason,
        ruleIndex: evaluation.ruleIndex,
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      projectId,
      environment: environment.slug,
      version: version ? String(version.number) : 'draft',
      evaluations,
      values: Object.fromEntries(
        evaluations.map((evaluation) => [evaluation.key, evaluation.value])
      ),
    });
  } catch (error) {
    if (error instanceof PublicSdkAuthError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (isApiError(error)) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error('Unable to evaluate feature flags.', error);
    return res.status(500).json({ error: 'Unable to evaluate feature flags.' });
  }
}

function isApiError(
  error: unknown
): error is { status: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

function getSingleQueryValue(value: string | string[] | undefined) {
  return typeof value === 'string' && value ? value : null;
}
