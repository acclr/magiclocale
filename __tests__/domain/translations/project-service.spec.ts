import {
  LocaleCatalogError,
  ProjectService,
} from '../../../domain/translations';
import {
  MemoryRepository,
  type StoreState,
} from '../../../test-support/translations-memory-repository';

function setup() {
  const state: StoreState = {
    projects: [
      {
        id: 'project_a',
        teamId: 'team_a',
        name: 'Website',
        sourceLocale: 'en',
        locales: ['en', 'sv'],
        localeFormat: 'language',
        billingScope: 'team',
        billingId: null,
      },
      {
        id: 'project_b',
        teamId: 'team_b',
        name: 'Other team',
        sourceLocale: 'de',
        locales: ['de'],
        localeFormat: 'language',
        billingScope: 'team',
        billingId: null,
      },
    ],
    keys: [],
    translations: [],
  };
  const repository = new MemoryRepository(state);
  const service = new ProjectService(repository);
  return { repository, service };
}

describe('ProjectService', () => {
  it('lists and gets only projects owned by the requested team', async () => {
    const { service } = setup();

    await expect(service.list('team_a')).resolves.toMatchObject([
      { id: 'project_a' },
    ]);
    await expect(service.get('team_a', 'project_a')).resolves.toMatchObject({
      name: 'Website',
    });
    await expect(service.get('team_a', 'project_b')).rejects.toThrow(
      'Project not found: project_b'
    );
  });

  it('creates a team-scoped project with normalized unique locales', async () => {
    const { service } = setup();

    const created = await service.create(' team_a ', {
      name: ' Mobile ',
      sourceLocale: 'en',
      locales: ['sv', 'en', ' sv '],
    });

    expect(created).toMatchObject({
      teamId: 'team_a',
      name: 'Mobile',
      sourceLocale: 'en',
      locales: ['en', 'sv'],
      localeFormat: 'language',
      billingScope: 'team',
    });
  });

  it('normalizes regional tags and stores the chosen locale format', async () => {
    const { service } = setup();

    await expect(
      service.create('team_a', {
        name: 'Nordics',
        sourceLocale: 'en-gb',
        locales: ['sv-se', 'nb-no'],
        localeFormat: 'regional',
      })
    ).resolves.toMatchObject({
      sourceLocale: 'en-GB',
      locales: ['en-GB', 'sv-SE', 'nb-NO'],
      localeFormat: 'regional',
    });
  });

  it('rejects invented locale codes and format mismatches', async () => {
    const { service } = setup();

    await expect(
      service.create('team_a', { name: 'Bad', sourceLocale: 'dk' })
    ).rejects.toThrow(LocaleCatalogError);
    await expect(
      service.create('team_a', {
        name: 'Mixed',
        sourceLocale: 'en',
        locales: ['sv-SE'],
        localeFormat: 'language',
      })
    ).rejects.toThrow(LocaleCatalogError);
    await expect(
      service.addLocale('team_a', 'project_a', 'en-GB')
    ).rejects.toThrow(LocaleCatalogError);
    await expect(
      service.addLocale('team_a', 'project_a', 'FR')
    ).resolves.toMatchObject({ locales: ['en', 'sv', 'fr'] });
  });

  it('moves a project between team retainer and per-project billing', async () => {
    const { service } = setup();

    await expect(
      service.setBillingScope('team_a', 'project_a', 'project')
    ).resolves.toMatchObject({ billingScope: 'project' });
    await expect(
      service.setBillingScope('team_b', 'project_a', 'team')
    ).rejects.toThrow('Project not found: project_a');
  });

  it('renames and deletes only within the owning team', async () => {
    const { repository, service } = setup();

    await expect(
      service.rename('team_b', 'project_a', 'Compromised')
    ).rejects.toThrow('Project not found: project_a');
    await expect(service.delete('team_b', 'project_a')).rejects.toThrow(
      'Project not found: project_a'
    );

    await expect(
      service.rename('team_a', 'project_a', 'Dashboard')
    ).resolves.toMatchObject({ name: 'Dashboard' });
    await service.delete('team_a', 'project_a');
    await expect(repository.getProject('project_a')).resolves.toBeNull();
  });

  it('adds and removes locales without duplicates', async () => {
    const { service } = setup();

    await expect(
      service.addLocale('team_a', 'project_a', 'fr')
    ).resolves.toMatchObject({ locales: ['en', 'sv', 'fr'] });
    await expect(
      service.addLocale('team_a', 'project_a', 'fr')
    ).resolves.toMatchObject({ locales: ['en', 'sv', 'fr'] });
    await expect(
      service.removeLocale('team_a', 'project_a', 'sv')
    ).resolves.toMatchObject({ locales: ['en', 'fr'] });
  });

  it('never removes the source locale', async () => {
    const { service } = setup();

    await expect(
      service.removeLocale('team_a', 'project_a', 'en')
    ).rejects.toThrow('The source locale cannot be removed');
  });

  it('rejects empty project and locale values', async () => {
    const { service } = setup();

    await expect(
      service.create('team_a', { name: ' ', sourceLocale: 'en' })
    ).rejects.toThrow('Project name is required');
    await expect(service.addLocale('team_a', 'project_a', ' ')).rejects.toThrow(
      'Locale is required'
    );
  });
});
