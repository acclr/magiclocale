import 'server-only';

import { OpenAITranslator } from '../../data/translations/openai-translator';
import { PrismaTranslationRepository } from '../../data/translations/prisma-translation-repository';
import {
  ProjectService,
  TeamTranslationService,
  TranslationService,
  type ProjectRepository,
  type TranslationRepository,
  type Translator,
} from '../../domain/translations';
import { getOpenAITranslationEnv } from '../env';
import { prisma } from '../prisma';

type TranslationRepositoryDependencies = ProjectRepository &
  TranslationRepository;

export type TranslationServices = {
  projectService: ProjectService;
  teamTranslationService: TeamTranslationService;
  translationService: TranslationService;
};

export type TranslationServiceDependencies = {
  repository?: TranslationRepositoryDependencies;
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

export function createTranslationServices(
  dependencies: TranslationServiceDependencies = {}
): TranslationServices {
  const repository =
    dependencies.repository ?? new PrismaTranslationRepository(prisma);
  const translator = dependencies.translator ?? createEnvironmentTranslator();
  const projectService = new ProjectService(repository);
  const translationService = new TranslationService(repository, translator);

  return {
    projectService,
    teamTranslationService: new TeamTranslationService(
      repository,
      projectService,
      translationService
    ),
    translationService,
  };
}

let repository: PrismaTranslationRepository | undefined;
let projectService: ProjectService | undefined;
let teamTranslationService: TeamTranslationService | undefined;
let translationService: TranslationService | undefined;

export function getTranslationRepository(): PrismaTranslationRepository {
  repository ??= new PrismaTranslationRepository(prisma);
  return repository;
}

export function getProjectService(): ProjectService {
  projectService ??= new ProjectService(getTranslationRepository());
  return projectService;
}

export function getTranslationService(): TranslationService {
  translationService ??= new TranslationService(
    getTranslationRepository(),
    createEnvironmentTranslator()
  );
  return translationService;
}

export function getTeamTranslationService(): TeamTranslationService {
  teamTranslationService ??= new TeamTranslationService(
    getTranslationRepository(),
    getProjectService(),
    getTranslationService()
  );
  return teamTranslationService;
}

export function getTranslationServices(): TranslationServices {
  return {
    projectService: getProjectService(),
    teamTranslationService: getTeamTranslationService(),
    translationService: getTranslationService(),
  };
}
