import type { TranslationRepository } from '../../domain/translations';

export type TranslationBundle = {
  projectId: string;
  locale: string;
  sourceLocale: string;
  translations: Record<string, string>;
  version: string;
};

export type TranslationBundleResult =
  | { success: true; bundle: TranslationBundle }
  | { success: false; reason: 'project-not-found' | 'locale-not-configured' };

export async function buildTranslationBundle(
  repository: TranslationRepository,
  projectId: string,
  locale: string
): Promise<TranslationBundleResult> {
  const project = await repository.getProject(projectId);
  if (!project) {
    return { success: false, reason: 'project-not-found' };
  }

  if (!project.locales.includes(locale)) {
    return { success: false, reason: 'locale-not-configured' };
  }

  const [keys, translations] = await Promise.all([
    repository.listKeys(projectId),
    repository.listTranslations(projectId),
  ]);
  const targetByKeyId = new Map(
    translations
      .filter((translation) => translation.locale === locale)
      .map((translation) => [translation.translationKeyId, translation])
  );
  const values: Record<string, string> = {};
  let latestUpdate = 0;

  for (const key of keys) {
    const translation = targetByKeyId.get(key.id);
    if (translation) {
      values[key.key] = translation.value;
      latestUpdate = Math.max(latestUpdate, translation.updatedAt.getTime());
    } else if (locale === project.sourceLocale) {
      values[key.key] = key.sourceText;
    }
  }

  return {
    success: true,
    bundle: {
      projectId,
      locale,
      sourceLocale: project.sourceLocale,
      translations: values,
      version: new Date(latestUpdate).toISOString(),
    },
  };
}
