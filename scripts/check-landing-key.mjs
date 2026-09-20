import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

function env(name) {
  const text = readFileSync('.env', 'utf8');
  const match = text.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim().replace(/^"|"$/g, '') : '';
}

const projectId = env('KEYKIT_LANDING_PROJECT_ID');
const token = env('KEYKIT_LANDING_API_KEY');
const hash = createHash('sha256').update(token).digest('hex');

const prisma = new PrismaClient();
const key = await prisma.apiKey.findUnique({
  where: { hashedKey: hash },
  select: {
    id: true,
    teamId: true,
    projectId: true,
    expiresAt: true,
    name: true,
  },
});
const project = await prisma.translationProject.findUnique({
  where: { id: projectId },
  select: { id: true, name: true, teamId: true },
});

console.log(
  JSON.stringify(
    {
      configuredProjectId: projectId,
      keyFound: Boolean(key),
      keyExpired: key?.expiresAt ? key.expiresAt <= new Date() : false,
      keyProjectId: key?.projectId ?? null,
      projectFound: Boolean(project),
      teamMatch: key && project ? key.teamId === project.teamId : null,
      projectScopeOk:
        key && project
          ? !key.projectId || key.projectId === project.id
          : null,
    },
    null,
    2
  )
);

const projects = await prisma.translationProject.findMany({
  select: { id: true, name: true },
  take: 15,
});
console.log('projects in db:', projects);

await prisma.$disconnect();
