import { EMPTY_FLAG_SET, type FlagSetSnapshot } from '@/domain/flags';
import { createTtlCache } from '@/lib/cache/ttl-cache';
import { prisma } from '@/lib/prisma';
import {
  getEnvironmentService,
  getTranslationRepository,
  getVersionService,
} from '@/lib/translations';
import {
  buildTranslationBundle,
  type TranslationBundle,
} from '@/lib/translations/translation-bundle';
import { toPublicFlagPayload } from '@/lib/flags/flag-payload';

import { rememberApiKeyUse, touchApiKeyIfStale } from './api-key-touch';
import { asTranslationMap, etagMatches } from './public-content-codec';
import { extractBearerToken, hashPublicApiKey } from './public-sdk-auth';
import { authenticatePublicSdkApiRequest } from './public-sdk-auth-prisma';

export const PUBLIC_LIVE_CACHE_CONTROL = 'private, no-cache';

const PUBLISHED_TTL_MS = 30_000;
const WORKING_COPY_TTL_MS = 10_000;
const PINNED_TTL_MS = 60 * 60 * 1000;

const responseCache = createTtlCache(300);

type CachedResponse<T> = {
  apiKeyId: string;
  body: T;
  etag: string;
  cacheControl: string;
};

export type PublicServeResult<T> =
  | {
      kind: 'ok';
      body: T;
      etag: string;
      cacheControl: string;
    }
  | {
      kind: 'not-modified';
      etag: string;
      cacheControl: string;
    }
  | {
      kind: 'error';
      status: number;
      error: string;
    };

type PublishedAccessRow = {
  apiKeyId: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  keyEnvironmentId: string | null;
  projectId: string | null;
  sourceLocale: string | null;
  locales: string[] | null;
  environmentId: string | null;
  environmentSlug: string | null;
  liveVersionId: string | null;
  versionNumber: number | null;
  publishedAt: Date | null;
};

type PublishedTranslationRow = PublishedAccessRow & {
  translations: unknown;
};

type PublishedFlagRow = PublishedAccessRow & {
  flagsSnapshot: unknown;
};

type ServeInput = {
  authorization: string | string[] | undefined;
  projectId: string;
  environment: string | null;
  ifNoneMatch?: string | string[];
};

export async function servePublicTranslation(
  input: ServeInput & { locale: string; version: number | null }
): Promise<PublicServeResult<TranslationBundle>> {
  const token = extractBearerToken(input.authorization);
  if (!token) {
    return { kind: 'error', status: 401, error: 'Invalid API key.' };
  }

  const hashedKey = hashPublicApiKey(token);
  const cacheKey = [
    'translations',
    hashedKey,
    input.projectId,
    input.environment ?? '',
    input.locale,
    input.version ?? 'live',
  ].join(':');
  const cached = responseCache.get<CachedResponse<TranslationBundle>>(cacheKey);
  if (cached) {
    await touchApiKeyIfStale(cached.apiKeyId);
    return fromCache(cached, input.ifNoneMatch);
  }

  if (input.version !== null) {
    return servePinnedTranslation(input, cacheKey);
  }

  try {
    const row = await queryPublishedTranslation(
      hashedKey,
      input.projectId,
      input.environment,
      input.locale
    );
    const gate = gatePublishedRow(row, input.locale);
    if (gate.kind === 'error') {
      return gate;
    }
    if (gate.kind === 'repository') {
      return servePinnedTranslation(input, cacheKey);
    }

    if (!row?.versionNumber || !row.environmentSlug || !row.projectId) {
      return serveWorkingCopyTranslation(input, row, cacheKey);
    }

    const body: TranslationBundle = {
      projectId: row.projectId,
      environment: row.environmentSlug,
      locale: input.locale,
      sourceLocale: row.sourceLocale ?? input.locale,
      translations: asTranslationMap(row.translations),
      version: String(row.versionNumber),
      versionNumber: row.versionNumber,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    };
    const etag = `"${body.environment}:${body.version}:${input.locale}"`;
    rememberApiKeyUse(row.apiKeyId, row.lastUsedAt);
    await touchApiKeyIfStale(row.apiKeyId);
    return store(cacheKey, row.apiKeyId, body, etag, PUBLIC_LIVE_CACHE_CONTROL, PUBLISHED_TTL_MS, input.ifNoneMatch);
  } catch (error) {
    console.error('Published translation read failed.', error);
    return servePinnedTranslation(input, cacheKey);
  }
}

export type PublicFlagBody = {
  projectId: string;
  environment: string;
  version: string;
  versionNumber: number | null;
  flags: ReturnType<typeof toPublicFlagPayload>;
};

export async function servePublicFlags(
  input: ServeInput
): Promise<PublicServeResult<PublicFlagBody>> {
  const token = extractBearerToken(input.authorization);
  if (!token) {
    return { kind: 'error', status: 401, error: 'Invalid API key.' };
  }

  const hashedKey = hashPublicApiKey(token);
  const cacheKey = [
    'flags',
    hashedKey,
    input.projectId,
    input.environment ?? '',
  ].join(':');
  const cached = responseCache.get<CachedResponse<PublicFlagBody>>(cacheKey);
  if (cached) {
    await touchApiKeyIfStale(cached.apiKeyId);
    return fromCache(cached, input.ifNoneMatch);
  }

  try {
    const row = await queryPublishedFlags(
      hashedKey,
      input.projectId,
      input.environment
    );
    const gate = gatePublishedRow(row, null);
    if (gate.kind === 'error') {
      return gate;
    }
    if (gate.kind === 'repository' || !row?.environmentId || !row.environmentSlug) {
      return serveRepositoryFlags(input, cacheKey);
    }

    if (!row.versionNumber || !row.projectId) {
      return serveRepositoryFlags(input, cacheKey, row.environmentId);
    }

    const payload = toPublicFlagPayload(asFlagSet(row.flagsSnapshot));
    const body: PublicFlagBody = {
      projectId: row.projectId,
      environment: row.environmentSlug,
      version: String(row.versionNumber),
      versionNumber: row.versionNumber,
      flags: payload,
    };
    const etag = `"${body.environment}:${body.version}:flags"`;
    rememberApiKeyUse(row.apiKeyId, row.lastUsedAt);
    await touchApiKeyIfStale(row.apiKeyId);
    return store(
      cacheKey,
      row.apiKeyId,
      body,
      etag,
      PUBLIC_LIVE_CACHE_CONTROL,
      PUBLISHED_TTL_MS,
      input.ifNoneMatch
    );
  } catch (error) {
    console.error('Published flag read failed.', error);
    return serveRepositoryFlags(input, cacheKey);
  }
}

function asFlagSet(value: unknown): FlagSetSnapshot {
  const source = typeof value === 'string' ? parseJson(value) : value;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return EMPTY_FLAG_SET;
  }
  if (!Array.isArray((source as { flags?: unknown }).flags)) {
    return EMPTY_FLAG_SET;
  }
  return source as FlagSetSnapshot;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function fromCache<T>(
  cached: CachedResponse<T>,
  ifNoneMatch: string | string[] | undefined
): PublicServeResult<T> {
  const header = Array.isArray(ifNoneMatch) ? ifNoneMatch[0] : ifNoneMatch;
  if (etagMatches(header, cached.etag)) {
    return {
      kind: 'not-modified',
      etag: cached.etag,
      cacheControl: cached.cacheControl,
    };
  }
  return {
    kind: 'ok',
    body: cached.body,
    etag: cached.etag,
    cacheControl: cached.cacheControl,
  };
}

function store<T>(
  cacheKey: string,
  apiKeyId: string,
  body: T,
  etag: string,
  cacheControl: string,
  ttlMs: number,
  ifNoneMatch: string | string[] | undefined
): PublicServeResult<T> {
  const cached = { apiKeyId, body, etag, cacheControl };
  responseCache.set(cacheKey, cached, ttlMs);
  return fromCache(cached, ifNoneMatch);
}

function gatePublishedRow(
  row: PublishedAccessRow | null,
  locale: string | null,
  now = new Date()
): { kind: 'ok' } | { kind: 'repository' } | PublicServeResult<never> {
  if (!row) {
    return { kind: 'error', status: 401, error: 'Invalid or expired API key.' };
  }
  if (row.expiresAt && row.expiresAt <= now) {
    return { kind: 'error', status: 401, error: 'Invalid or expired API key.' };
  }
  rememberApiKeyUse(row.apiKeyId, row.lastUsedAt);
  if (!row.projectId) {
    return { kind: 'error', status: 404, error: 'Project not found.' };
  }
  if (locale && !(row.locales ?? []).includes(locale)) {
    return {
      kind: 'error',
      status: 422,
      error: 'Locale is not configured for this project.',
    };
  }
  if (!row.environmentId) {
    if (row.keyEnvironmentId) {
      return { kind: 'error', status: 404, error: 'Environment not found.' };
    }
    return { kind: 'repository' };
  }
  return { kind: 'ok' };
}

async function serveWorkingCopyTranslation(
  input: ServeInput & { locale: string; version: number | null },
  row: PublishedTranslationRow | null,
  cacheKey: string
): Promise<PublicServeResult<TranslationBundle>> {
  const environment = row?.environmentId ?? input.environment;
  const result = await buildTranslationBundle(
    {
      repository: getTranslationRepository(),
      environmentService: getEnvironmentService(),
      versionService: getVersionService(),
    },
    {
      projectId: input.projectId,
      locale: input.locale,
      environment,
      version: input.version,
    }
  );
  if (!result.success) {
    return bundleFailure(result.reason);
  }
  const etag = `"${result.bundle.environment}:${result.bundle.version}:${input.locale}"`;
  if (row) {
    await touchApiKeyIfStale(row.apiKeyId);
  }
  return store(
    cacheKey,
    row?.apiKeyId ?? 'unknown',
    result.bundle,
    etag,
    PUBLIC_LIVE_CACHE_CONTROL,
    WORKING_COPY_TTL_MS,
    input.ifNoneMatch
  );
}

async function servePinnedTranslation(
  input: ServeInput & { locale: string; version: number | null },
  cacheKey: string
): Promise<PublicServeResult<TranslationBundle>> {
  try {
    const { environmentRef, apiKey } = await authenticatePublicSdkApiRequest(
      input.authorization,
      input.projectId,
      input.environment
    );
    const result = await buildTranslationBundle(
      {
        repository: getTranslationRepository(),
        environmentService: getEnvironmentService(),
        versionService: getVersionService(),
      },
      {
        projectId: input.projectId,
        locale: input.locale,
        environment: environmentRef,
        version: input.version,
      }
    );
    if (!result.success) {
      return bundleFailure(result.reason);
    }
    const immutable =
      input.version !== null && result.bundle.versionNumber !== null;
    const cacheControl = immutable
      ? 'public, max-age=31536000, immutable'
      : PUBLIC_LIVE_CACHE_CONTROL;
    const etag = `"${result.bundle.environment}:${result.bundle.version}:${input.locale}"`;
    return store(
      cacheKey,
      apiKey.id,
      result.bundle,
      etag,
      cacheControl,
      immutable ? PINNED_TTL_MS : WORKING_COPY_TTL_MS,
      input.ifNoneMatch
    );
  } catch (error) {
    return authFailure(error);
  }
}

async function serveRepositoryFlags(
  input: ServeInput,
  cacheKey: string,
  environmentId?: string
): Promise<PublicServeResult<PublicFlagBody>> {
  try {
    const { environmentRef, apiKey } = await authenticatePublicSdkApiRequest(
      input.authorization,
      input.projectId,
      input.environment
    );
    const environment = await getEnvironmentService().resolve(
      input.projectId,
      environmentId ?? environmentRef
    );
    const { flags, version } = await getVersionService().resolveFlags(
      environment.id
    );
    const body: PublicFlagBody = {
      projectId: input.projectId,
      environment: environment.slug,
      version: version ? String(version.number) : 'draft',
      versionNumber: version?.number ?? null,
      flags: toPublicFlagPayload(flags),
    };
    const etag = `"${body.environment}:${body.version}:flags"`;
    return store(
      cacheKey,
      apiKey.id,
      body,
      etag,
      PUBLIC_LIVE_CACHE_CONTROL,
      version ? PUBLISHED_TTL_MS : WORKING_COPY_TTL_MS,
      input.ifNoneMatch
    );
  } catch (error) {
    return authFailure(error);
  }
}

function bundleFailure(reason: string): PublicServeResult<never> {
  if (reason === 'locale-not-configured') {
    return {
      kind: 'error',
      status: 422,
      error: 'Locale is not configured for this project.',
    };
  }
  if (reason === 'version-not-found') {
    return { kind: 'error', status: 404, error: 'Version not found.' };
  }
  if (reason === 'environment-not-found') {
    return { kind: 'error', status: 404, error: 'Environment not found.' };
  }
  return { kind: 'error', status: 404, error: 'Project not found.' };
}

function authFailure(error: unknown): PublicServeResult<never> {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  ) {
    return {
      kind: 'error',
      status: error.status,
      error: String(error.message),
    };
  }
  throw error;
}

async function queryPublishedTranslation(
  hashedKey: string,
  projectId: string,
  environment: string | null,
  locale: string
): Promise<PublishedTranslationRow | null> {
  const env = (environment ?? '').trim().toLowerCase();
  const rows = await prisma.$queryRaw<PublishedTranslationRow[]>`
    SELECT
      k.id AS "apiKeyId",
      k."expiresAt" AS "expiresAt",
      k."lastUsedAt" AS "lastUsedAt",
      k."environmentId" AS "keyEnvironmentId",
      p.id AS "projectId",
      p."sourceLocale" AS "sourceLocale",
      p.locales AS "locales",
      e.id AS "environmentId",
      e.slug AS "environmentSlug",
      e."liveVersionId" AS "liveVersionId",
      v.number AS "versionNumber",
      v."publishedAt" AS "publishedAt",
      b.translations AS "translations"
    FROM "ApiKey" k
    LEFT JOIN "TranslationProject" p
      ON p.id = ${projectId}
     AND p."teamId" = k."teamId"
     AND (k."projectId" IS NULL OR k."projectId" = p.id)
    LEFT JOIN LATERAL (
      SELECT *
      FROM "Environment" env
      WHERE p.id IS NOT NULL
        AND env."projectId" = p.id
        AND (
          (k."environmentId" IS NOT NULL AND env.id = k."environmentId")
          OR (
            k."environmentId" IS NULL
            AND (
              (${env} = '' AND env."isProduction" = true)
              OR (
                ${env} <> ''
                AND (env.slug = ${env} OR env.id = ${env})
              )
            )
          )
        )
      ORDER BY
        CASE
          WHEN k."environmentId" IS NOT NULL AND env.id = k."environmentId" THEN 0
          WHEN ${env} <> '' AND env.slug = ${env} THEN 0
          WHEN env."isProduction" = true THEN 1
          ELSE 2
        END,
        env."createdAt" ASC
      LIMIT 1
    ) e ON true
    LEFT JOIN "Version" v
      ON v.id = e."liveVersionId"
     AND v.status::text = 'PUBLISHED'
    LEFT JOIN "VersionLocaleBundle" b
      ON b."versionId" = v.id
     AND b.locale = ${locale}
    WHERE k."hashedKey" = ${hashedKey}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function queryPublishedFlags(
  hashedKey: string,
  projectId: string,
  environment: string | null
): Promise<PublishedFlagRow | null> {
  const env = (environment ?? '').trim().toLowerCase();
  const rows = await prisma.$queryRaw<PublishedFlagRow[]>`
    SELECT
      k.id AS "apiKeyId",
      k."expiresAt" AS "expiresAt",
      k."lastUsedAt" AS "lastUsedAt",
      k."environmentId" AS "keyEnvironmentId",
      p.id AS "projectId",
      p."sourceLocale" AS "sourceLocale",
      p.locales AS "locales",
      e.id AS "environmentId",
      e.slug AS "environmentSlug",
      e."liveVersionId" AS "liveVersionId",
      v.number AS "versionNumber",
      v."publishedAt" AS "publishedAt",
      v."flagsSnapshot" AS "flagsSnapshot"
    FROM "ApiKey" k
    LEFT JOIN "TranslationProject" p
      ON p.id = ${projectId}
     AND p."teamId" = k."teamId"
     AND (k."projectId" IS NULL OR k."projectId" = p.id)
    LEFT JOIN LATERAL (
      SELECT *
      FROM "Environment" env
      WHERE p.id IS NOT NULL
        AND env."projectId" = p.id
        AND (
          (k."environmentId" IS NOT NULL AND env.id = k."environmentId")
          OR (
            k."environmentId" IS NULL
            AND (
              (${env} = '' AND env."isProduction" = true)
              OR (
                ${env} <> ''
                AND (env.slug = ${env} OR env.id = ${env})
              )
            )
          )
        )
      ORDER BY
        CASE
          WHEN k."environmentId" IS NOT NULL AND env.id = k."environmentId" THEN 0
          WHEN ${env} <> '' AND env.slug = ${env} THEN 0
          WHEN env."isProduction" = true THEN 1
          ELSE 2
        END,
        env."createdAt" ASC
      LIMIT 1
    ) e ON true
    LEFT JOIN "Version" v
      ON v.id = e."liveVersionId"
     AND v.status::text = 'PUBLISHED'
    WHERE k."hashedKey" = ${hashedKey}
    LIMIT 1
  `;
  return rows[0] ?? null;
}
