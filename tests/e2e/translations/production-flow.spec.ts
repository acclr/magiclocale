import { expect, test } from '@playwright/test';

import { prisma } from '@/lib/prisma';
import { PrismaTranslationRepository } from '../../../data/translations/prisma-translation-repository';
import { TranslationService } from '../../../domain/translations';
import { createApiKey } from '../../../models/apiKey';
import { FakeTranslator } from '../../../test-support/fake-translator';
import { LoginPage } from '../support/fixtures';
import { team, user } from '../support/helper';

const projectName = 'Playwright production flow';
const apiKeyName = 'Playwright translation bundle';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.credentialLogin(user.email, user.password);
  await loginPage.loggedInCheck(team.slug);
});

test.afterEach(async () => {
  const testTeam = await prisma.team.findUnique({ where: { slug: team.slug } });
  if (!testTeam) {
    return;
  }

  await prisma.apiKey.deleteMany({
    where: { teamId: testTeam.id, name: apiKeyName },
  });
  await prisma.translationProject.deleteMany({
    where: { teamId: testTeam.id, name: projectName },
  });
});

test('preserves a manual value after source sync and serves it in the bundle', async ({
  page,
  request,
}) => {
  await page.goto(`/teams/${team.slug}/products`);
  await page.getByRole('button', { name: 'New Project' }).click();
  await page.getByLabel('Project Name').fill(projectName);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('link', { name: new RegExp(projectName) }).click();

  await page.getByLabel('Add Locale').fill('sv');
  await page.getByRole('option', { name: /Swedish \/ Svenska/ }).click();
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  const project = await prisma.translationProject.findFirstOrThrow({
    where: { team: { slug: team.slug }, name: projectName },
  });
  const translationService = new TranslationService(
    new PrismaTranslationRepository(prisma),
    new FakeTranslator()
  );

  await translationService.syncFromSource(project.id, [
    { key: 'settings.save', sourceText: 'Save changes' },
  ]);
  await page.getByRole('button', { name: 'Refresh' }).click();

  const row = page.getByRole('row').filter({ hasText: 'settings.save' });
  const swedish = row.getByRole('textbox', { name: 'sv translation' });
  await swedish.fill('Spara manuellt');
  await swedish.blur();
  await expect
    .poll(async () => {
      const translation = await prisma.translation.findFirst({
        where: {
          locale: 'sv',
          translationKey: { projectId: project.id, key: 'settings.save' },
        },
      });
      return translation
        ? {
            value: translation.value,
            source: translation.source,
            aiLocked: translation.aiLocked,
          }
        : null;
    })
    .toEqual({
      value: 'Spara manuellt',
      source: 'MANUAL',
      aiLocked: true,
    });

  await translationService.syncFromSource(project.id, [
    { key: 'settings.save', sourceText: 'Save settings' },
  ]);
  await page.getByRole('button', { name: 'Refresh' }).click();

  await expect(swedish).toHaveValue('Spara manuellt');
  await expect(row.getByText('Needs Review', { exact: true })).toBeVisible();

  const publicApiKey = await createApiKey({
    name: apiKeyName,
    teamId: project.teamId,
  });
  const response = await request.get(
    `/api/v1/projects/${project.id}/translations?locale=sv`,
    { headers: { Authorization: `Bearer ${publicApiKey}` } }
  );

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    projectId: project.id,
    locale: 'sv',
    sourceLocale: 'en',
    translations: { 'settings.save': 'Spara manuellt' },
  });
});
