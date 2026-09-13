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
    query.version
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
