import { PrismaArchitectureRepository } from '../../data/architecture/prisma-architecture-repository';
import { PrismaEnvironmentRepository } from '../../data/environments/prisma-environment-repository';
import { PrismaFlagRepository } from '../../data/flags/prisma-flag-repository';
import { PrismaKeyCatalogRepository } from '../../data/keys/prisma-key-catalog-repository';
import { PrismaMigrationRepository } from '../../data/migrations/prisma-migration-repository';
import { OpenAITranslator } from '../../data/translations/openai-translator';
import { PrismaTranslationRepository } from '../../data/translations/prisma-translation-repository';
import { PrismaVersionRepository } from '../../data/versions/prisma-version-repository';
import { ArchitectureService } from '../../domain/architecture';
import {
  EnvironmentService,
  type EnvironmentRepository,
} from '../../domain/environments';
import { FlagService, type FlagRepository } from '../../domain/flags';
import {
  KeyCatalogService,
  type KeyCatalogRepository,
} from '../../domain/keys';
import { MigrationService } from '../../domain/migrations';
import {
  ProjectService,
  TeamTranslationService,
  TranslationService,
  type ProjectRepository,
  type TranslationRepository,
  type Translator,
} from '../../domain/translations';
import {
  VersionService,
  type VersionRepository,
} from '../../domain/versions';
import { getOpenAITranslationEnv } from '../env';
import { prisma } from '../prisma';

type TranslationRepositoryDependencies = ProjectRepository &
  TranslationRepository;

export type TranslationServices = {
  projectService: ProjectService;
  teamTranslationService: TeamTranslationService;
  translationService: TranslationService;
  environmentService: EnvironmentService;
  versionService: VersionService;
  flagService: FlagService;
  keyCatalogService: KeyCatalogService;
  architectureService: ArchitectureService;
  migrationService: MigrationService;
};

export type TranslationServiceDependencies = {
  repository?: TranslationRepositoryDependencies;
  environmentRepository?: EnvironmentRepository;
  versionRepository?: VersionRepository;
  flagRepository?: FlagRepository;
  keyCatalogRepository?: KeyCatalogRepository;
  translator?: Translator;
};

function createEnvironmentTranslator(): Translator {
  let translator: OpenAITranslator | undefined;

  return {
    translate(input) {
      translator ??= new OpenAITranslator(getOpenAITranslationEnv());
      return translator.translate(input);
    },
  };
}

/**
 * Single composition root for the translation, environment, versioning, and
 * feature flag services.
 *
 * The version service both consumes flag snapshots and receives change
 * reports from the translation and flag services. That mutual need is
 * satisfied through the narrow ports each domain declares, wired here with
 * closures, so no domain module imports another's implementation.
 */
export function createTranslationServices(
  dependencies: TranslationServiceDependencies = {}
): TranslationServices {
  const repository =
    dependencies.repository ?? new PrismaTranslationRepository(prisma);
  const environmentRepository =
    dependencies.environmentRepository ??
    new PrismaEnvironmentRepository(prisma);
  const versionRepository =
    dependencies.versionRepository ?? new PrismaVersionRepository(prisma);
  const flagRepository =
    dependencies.flagRepository ?? new PrismaFlagRepository(prisma);
  const keyCatalogRepository =
    dependencies.keyCatalogRepository ??
    new PrismaKeyCatalogRepository(prisma);
  const translator = dependencies.translator ?? createEnvironmentTranslator();

  const projectService = new ProjectService(repository);
  const environmentService = new EnvironmentService(
    environmentRepository,
    projectService
  );
  const keyCatalogService = new KeyCatalogService(
    keyCatalogRepository,
    projectService
  );
  const catalogWriter = {
    recordDetection: (input: Parameters<KeyCatalogRepository['recordDetection']>[0]) =>
      keyCatalogRepository.recordDetection(input),
    upsertDefinition: (
      input: Parameters<KeyCatalogRepository['upsert']>[0]
    ) => keyCatalogRepository.upsert(input),
  };

  const flagService = new FlagService(
    flagRepository,
    projectService,
    environmentService,
    {
      recordFlagChange: (change) => versionService.recordFlagChange(change),
    },
    catalogWriter
  );

  const versionService = new VersionService(
    versionRepository,
    repository,
    environmentRepository,
    {
      buildSnapshot: (environmentId) =>
        flagService.buildSnapshot(environmentId),
    }
  );

  const translationService = new TranslationService(
    repository,
    translator,
    {
      recordTranslationChange: (change) =>
        versionService.recordTranslationChange(change),
    },
    catalogWriter
  );

  const architectureService = new ArchitectureService(
    new PrismaArchitectureRepository(prisma),
    keyCatalogRepository,
    repository,
    flagRepository,
    projectService,
    environmentService
  );
  const migrationService = new MigrationService(
    new PrismaMigrationRepository(prisma),
    keyCatalogRepository,
    repository,
    flagRepository,
    projectService
  );

  return {
    projectService,
    teamTranslationService: new TeamTranslationService(
      repository,
      projectService,
      translationService,
      environmentService,
      keyCatalogRepository
    ),
    translationService,
    environmentService,
    versionService,
    flagService,
    keyCatalogService,
    architectureService,
    migrationService,
  };
}

let services: TranslationServices | undefined;
let repositorySingleton: PrismaTranslationRepository | undefined;
let versionRepositorySingleton: PrismaVersionRepository | undefined;

export function getTranslationRepository(): PrismaTranslationRepository {
  repositorySingleton ??= new PrismaTranslationRepository(prisma);
  return repositorySingleton;
}

export function getVersionRepository(): PrismaVersionRepository {
  versionRepositorySingleton ??= new PrismaVersionRepository(prisma);
  return versionRepositorySingleton;
}

export function getTranslationServices(): TranslationServices {
  const prismaReady =
    typeof (prisma as { team?: { findMany?: unknown } }).team?.findMany ===
    'function';
  if (!prismaReady) {
    services = undefined;
    repositorySingleton = undefined;
    versionRepositorySingleton = undefined;
  }
  services ??= createTranslationServices({
    repository: getTranslationRepository(),
    versionRepository: getVersionRepository(),
  });
  return services;
}

export function getProjectService(): ProjectService {
  return getTranslationServices().projectService;
}

export function getTranslationService(): TranslationService {
  return getTranslationServices().translationService;
}

export function getTeamTranslationService(): TeamTranslationService {
  return getTranslationServices().teamTranslationService;
}

export function getEnvironmentService(): EnvironmentService {
  return getTranslationServices().environmentService;
}

export function getVersionService(): VersionService {
  return getTranslationServices().versionService;
}

export function getFlagService(): FlagService {
  return getTranslationServices().flagService;
}

export function getKeyCatalogService(): KeyCatalogService {
  return getTranslationServices().keyCatalogService;
}

export function getArchitectureService(): ArchitectureService {
  return getTranslationServices().architectureService;
}

export function getMigrationService(): MigrationService {
  return getTranslationServices().migrationService;
}
