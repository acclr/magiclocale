import type { EnvironmentService } from '../../domain/environments';
import type { TranslationRepository } from '../../domain/translations';
import type { VersionService } from '../../domain/versions';

export type TranslationBundle = {
  projectId: string;
  /** Slug of the environment this bundle was served from. */
  environment: string;
  locale: string;
  sourceLocale: string;
  translations: Record<string, string>;
  /**
   * Cache token. The published version number, or `draft` for an environment
   * that has never been published.
   */
  version: string;
  versionNumber: number | null;
  publishedAt: string | null;
};

export type TranslationBundleFailure =
  | 'project-not-found'
  | 'environment-not-found'
  | 'locale-not-configured'
  | 'version-not-found';

export type TranslationBundleResult =
  | { success: true; bundle: TranslationBundle }
  | { success: false; reason: TranslationBundleFailure };

export type TranslationBundleDependencies = {
  repository: TranslationRepository;
  environmentService: EnvironmentService;
  versionService: Pick<VersionService, 'resolveLocaleBundle'>;
};

export type TranslationBundleQuery = {
  projectId: string;
  locale: string;
  /** Environment slug or id. Defaults to production. */
  environment?: string | null;
  /** Pin a specific published version instead of the environment's live one. */
  version?: number | null;
  /** Read the dashboard working copy instead of the published snapshot. */
  workingCopy?: boolean;
};

/**
 * Reads the environment's published snapshot rather than the live working
 * copy, so dashboard edits only reach an application once someone publishes.
 *
 * An environment that has never been published falls back to its working copy
 * so a newly created environment still serves something usable.
 */
export async function buildTranslationBundle(
  dependencies: TranslationBundleDependencies,
  query: TranslationBundleQuery
): Promise<TranslationBundleResult> {
  const project = await dependencies.repository.getProject(query.projectId);
  if (!project) {
    return { success: false, reason: 'project-not-found' };
  }

  if (!project.locales.includes(query.locale)) {
    return { success: false, reason: 'locale-not-configured' };
  }

  let environmentId: string;
  let environmentSlug: string;
  try {
    const environment = await dependencies.environmentService.resolve(
      project.id,
      query.environment
    );
    environmentId = environment.id;
    environmentSlug = environment.slug;
  } catch {
    return { success: false, reason: 'environment-not-found' };
  }

  const resolved = await dependencies.versionService.resolveLocaleBundle(
    environmentId,
    query.locale,
    query.version,
    { workingCopy: query.workingCopy }
  );

  if (
    query.version !== undefined &&
    query.version !== null &&
    !resolved.version
  ) {
    return { success: false, reason: 'version-not-found' };
  }

  return {
    success: true,
    bundle: {
      projectId: project.id,
      environment: environmentSlug,
      locale: query.locale,
      sourceLocale: project.sourceLocale,
      translations: resolved.bundle?.translations ?? {},
      version: resolved.version ? String(resolved.version.number) : 'draft',
      versionNumber: resolved.version?.number ?? null,
      publishedAt: resolved.version?.publishedAt?.toISOString() ?? null,
    },
  };
}

export type TranslationCatalog = {
  projectId: string;
  sourceLocale: string;
  environment: string;
  version: string;
  versionNumber: number | null;
  publishedAt: string | null;
  locales: Record<string, Record<string, string>>;
};

export type TranslationCatalogResult =
  | { success: true; catalog: TranslationCatalog }
  | { success: false; reason: TranslationBundleFailure };

export type TranslationCatalogQuery = Omit<TranslationBundleQuery, 'locale'>;

/**
 * All configured locales for an environment. Used by the CLI to write a
 * local catalog the SDK can consume without fetching on page load.
 */
export async function buildTranslationCatalog(
  dependencies: TranslationBundleDependencies,
  query: TranslationCatalogQuery
): Promise<TranslationCatalogResult> {
  const project = await dependencies.repository.getProject(query.projectId);
  if (!project) {
    return { success: false, reason: 'project-not-found' };
  }

  let environmentId: string;
  let environmentSlug: string;
  try {
    const environment = await dependencies.environmentService.resolve(
      project.id,
      query.environment
    );
    environmentId = environment.id;
    environmentSlug = environment.slug;
  } catch {
    return { success: false, reason: 'environment-not-found' };
  }

  const locales: Record<string, Record<string, string>> = {};
  let version: string = 'draft';
  let versionNumber: number | null = null;
  let publishedAt: string | null = null;

  for (const locale of project.locales) {
    const resolved = await dependencies.versionService.resolveLocaleBundle(
      environmentId,
      locale,
      query.version,
      { workingCopy: query.workingCopy }
    );
    if (
      query.version !== undefined &&
      query.version !== null &&
      !resolved.version
    ) {
      return { success: false, reason: 'version-not-found' };
    }
    locales[locale] = resolved.bundle?.translations ?? {};
    version = resolved.version ? String(resolved.version.number) : 'draft';
    versionNumber = resolved.version?.number ?? null;
    publishedAt = resolved.version?.publishedAt?.toISOString() ?? null;
  }

  return {
    success: true,
    catalog: {
      projectId: project.id,
      sourceLocale: project.sourceLocale,
      environment: environmentSlug,
      version,
      versionNumber,
      publishedAt,
      locales,
    },
  };
}
