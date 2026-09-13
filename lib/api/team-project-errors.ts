import { Prisma } from '@prisma/client';

import { EnvironmentLimitError } from '../../domain/environments';
import { FlagLimitError } from '../../domain/flags';
import { LocaleCatalogError } from '../../domain/translations';
import { VersionNotPublishedError } from '../../domain/versions';
import { ApiError } from '../errors';

export function normalizeTeamProjectApiError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof LocaleCatalogError) {
    return { status: 422, message: error.message };
  }
  if (
    error instanceof EnvironmentLimitError ||
    error instanceof FlagLimitError
  ) {
    return { status: 402, message: error.message };
  }
  if (error instanceof VersionNotPublishedError) {
    return { status: 422, message: error.message };
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return { status: 409, message: 'A project with this name already exists' };
  }

  const message =
    error instanceof Error ? error.message : 'Something went wrong';
  if (message === 'Unauthorized') {
    return { status: 401, message };
  }
  if (
    message.startsWith('Project not found:') ||
    message.startsWith('Translation key not found:') ||
    message.startsWith('Translation not found:') ||
    message.startsWith('Locale not found in project:') ||
    message.startsWith('Environment not found:') ||
    message.startsWith('Feature flag not found:') ||
    message.startsWith('Version not found:')
  ) {
    return { status: 404, message };
  }
  if (
    message.startsWith('Environment already exists:') ||
    message.startsWith('Feature flag already exists:')
  ) {
    return { status: 409, message };
  }
  if (
    message.includes('cannot be deleted') ||
    message.includes('already exists') ||
    message.startsWith('A project may have at most') ||
    message.startsWith('Choose a different environment') ||
    message.startsWith('Publish ') ||
    message.startsWith('Environments belong')
  ) {
    return { status: 422, message };
  }
  return { status: 500, message };
}
