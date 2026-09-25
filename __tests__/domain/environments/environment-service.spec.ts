import { EnvironmentService } from '../../../domain/environments';
import { ProjectService } from '../../../domain/translations';
import { MemoryRepository } from '../../../test-support/translations-memory-repository';

function setup() {
  const repository = new MemoryRepository({
    projects: [
      {
        id: 'project',
        teamId: 'team',
        name: 'App',
        sourceLocale: 'en',
        locales: ['en'],
        localeFormat: 'language',
        billingScope: 'team',
        billingId: null,
        allowedOrigins: [],
      },
    ],
    environments: [],
    keys: [],
    translations: [],
  });
  const projectService = new ProjectService(repository);
  const service = new EnvironmentService(repository, projectService);
  return { service };
}

describe('EnvironmentService', () => {
  it('creates production on first list and refuses a fourth environment', async () => {
    const { service } = setup();
    const listed = await service.list('team', 'project');
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({
      slug: 'production',
      isProduction: true,
    });

    await service.create('team', 'project', { slug: 'staging' });
    await service.create('team', 'project', { slug: 'development' });
    await expect(
      service.create('team', 'project', { slug: 'preview' })
    ).rejects.toMatchObject({ name: 'EnvironmentLimitError', limit: 3 });
  });

  it('cannot delete production', async () => {
    const { service } = setup();
    const [production] = await service.list('team', 'project');
    await expect(
      service.delete('team', 'project', production.id)
    ).rejects.toThrow('The production environment cannot be deleted');
  });
});
