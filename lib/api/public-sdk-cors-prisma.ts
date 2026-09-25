import type { NextApiRequest, NextApiResponse } from 'next';

import { prisma } from '@/lib/prisma';
import {
  corsHeaders,
  getPublicSdkCorsPolicyForProject,
  isAllowedOrigin,
} from '@/lib/api/public-sdk-cors';

export async function loadProjectAllowedOrigins(
  projectId: string
): Promise<string[]> {
  const rows = await prisma.$queryRaw<
    Array<{ allowedOrigins: string[] | null }>
  >`
    SELECT "allowedOrigins" FROM "TranslationProject" WHERE id = ${projectId}
    LIMIT 1
  `;
  return rows[0]?.allowedOrigins ?? [];
}

export async function applyPublicSdkCors(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<'preflight' | 'forbidden' | 'continue'> {
  const projectId =
    typeof req.query.projectId === 'string' && req.query.projectId
      ? req.query.projectId
      : null;
  const origin =
    typeof req.headers.origin === 'string' ? req.headers.origin : null;
  const policy = await getPublicSdkCorsPolicyForProject(
    projectId,
    loadProjectAllowedOrigins
  );

  for (const [name, value] of Object.entries(corsHeaders(origin, policy))) {
    res.setHeader(name, value);
  }

  if (!isAllowedOrigin(origin, policy)) {
    res.status(403).json({ error: 'Origin is not allowed.' });
    return 'forbidden';
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return 'preflight';
  }

  return 'continue';
}
