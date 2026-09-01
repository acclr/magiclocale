import { Prisma } from '@prisma/client';

import { LocaleCatalogError } from '../../domain/translations';
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
    message.startsWith('Locale not found in project:')
  ) {
    return { status: 404, message };
  }
  return { status: 500, message };
}
