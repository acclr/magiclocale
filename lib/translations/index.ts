import { PrismaEnvironmentRepository } from '../../data/environments/prisma-environment-repository';
import { PrismaFlagRepository } from '../../data/flags/prisma-flag-repository';
import { OpenAITranslator } from '../../data/translations/openai-translator';
import { PrismaTranslationRepository } from '../../data/translations/prisma-translation-repository';
import { PrismaVersionRepository } from '../../data/versions/prisma-version-repository';
import {
  EnvironmentService,
  type EnvironmentRepository,
} from '../../domain/environments';
import { FlagService, type FlagRepository } from '../../domain/flags';
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
};

export type TranslationServiceDependencies = {
  repository?: TranslationRepositoryDependencies;
  environmentRepository?: EnvironmentRepository;
  versionRepository?: VersionRepository;
  flagRepository?: FlagRepository;
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
  const translator = dependencies.translator ?? createEnvironmentTranslator();

  const projectService = new ProjectService(repository);
  const environmentService = new EnvironmentService(
    environmentRepository,
    projectService
  );

  const flagService = new FlagService(
    flagRepository,
    projectService,
    environmentService,
    {
      recordFlagChange: (change) => versionService.recordFlagChange(change),
    }
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

  const translationService = new TranslationService(repository, translator, {
    recordTranslationChange: (change) =>
      versionService.recordTranslationChange(change),
  });

  return {
    projectService,
    teamTranslationService: new TeamTranslationService(
      repository,
      projectService,
      translationService,
      environmentService
    ),
    translationService,
    environmentService,
    versionService,
    flagService,
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
