import {
  PrismaClient,
  type ArchitectureFinding as PrismaFinding,
  type ArchitectureRule as PrismaRule,
} from '@prisma/client';

import type { ArchitectureRepository } from '../../domain/architecture/repository';
import type {
  ArchitectureFinding,
  ArchitectureRule,
  ArchitectureRuleConfig,
  FindingKind,
  FindingStatus,
} from '../../domain/architecture/types';
import type { KeyType } from '../../domain/keys/types';
import { prisma } from '../../lib/prisma';

type PrismaFindingKindValue =
  | 'UNUSED_KEY'
  | 'STALE_FLAG'
  | 'DUPLICATE_TRANSLATION'
  | 'OVERLAPPING_FLAGS'
  | 'NAMESPACE_INCONSISTENCY'
  | 'MISSING_OWNER'
  | 'MISSING_DESCRIPTION'
  | 'NAMING_ISSUE'
  | 'UNKNOWN_FLAG'
  | 'TEMPORARY_FLAG_OVERDUE';

type PrismaFindingStatusValue = 'OPEN' | 'REVIEWED' | 'IGNORED' | 'INTENTIONAL';

type PrismaKeyTypeValue = 'TRANSLATION' | 'FEATURE_FLAG';

const kindToPrisma: Record<FindingKind, PrismaFindingKindValue> = {
  'unused-key': 'UNUSED_KEY',
  'stale-flag': 'STALE_FLAG',
  'duplicate-translation': 'DUPLICATE_TRANSLATION',
  'overlapping-flags': 'OVERLAPPING_FLAGS',
  'namespace-inconsistency': 'NAMESPACE_INCONSISTENCY',
  'missing-owner': 'MISSING_OWNER',
  'missing-description': 'MISSING_DESCRIPTION',
  'naming-issue': 'NAMING_ISSUE',
  'unknown-flag': 'UNKNOWN_FLAG',
  'temporary-flag-overdue': 'TEMPORARY_FLAG_OVERDUE',
};

const kindFromPrisma: Record<PrismaFindingKindValue, FindingKind> = {
  UNUSED_KEY: 'unused-key',
  STALE_FLAG: 'stale-flag',
  DUPLICATE_TRANSLATION: 'duplicate-translation',
  OVERLAPPING_FLAGS: 'overlapping-flags',
  NAMESPACE_INCONSISTENCY: 'namespace-inconsistency',
  MISSING_OWNER: 'missing-owner',
  MISSING_DESCRIPTION: 'missing-description',
  NAMING_ISSUE: 'naming-issue',
  UNKNOWN_FLAG: 'unknown-flag',
  TEMPORARY_FLAG_OVERDUE: 'temporary-flag-overdue',
};

const statusToPrisma: Record<FindingStatus, PrismaFindingStatusValue> = {
  open: 'OPEN',
  reviewed: 'REVIEWED',
  ignored: 'IGNORED',
  intentional: 'INTENTIONAL',
};

const statusFromPrisma: Record<PrismaFindingStatusValue, FindingStatus> = {
  OPEN: 'open',
  REVIEWED: 'reviewed',
  IGNORED: 'ignored',
  INTENTIONAL: 'intentional',
};

function toRule(row: PrismaRule): ArchitectureRule {
  return {
    id: row.id,
    projectId: row.projectId,
    keyType: row.keyType
      ? row.keyType === 'FEATURE_FLAG'
        ? 'feature-flag'
        : 'translation'
      : null,
    config: (row.config ?? {}) as ArchitectureRuleConfig,
  };
}

function toFinding(row: PrismaFinding): ArchitectureFinding {
  return {
    id: row.id,
    projectId: row.projectId,
    keyMetaId: row.keyMetaId,
    kind: kindFromPrisma[row.kind as PrismaFindingKindValue],
    status: statusFromPrisma[row.status as PrismaFindingStatusValue],
    title: row.title,
    message: row.message,
    suggestion: row.suggestion,
    createdAt: row.createdAt,
  };
}

function toPrismaKeyType(type: KeyType): PrismaKeyTypeValue {
  return type === 'feature-flag' ? 'FEATURE_FLAG' : 'TRANSLATION';
}

export class PrismaArchitectureRepository implements ArchitectureRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listRules(projectId: string): Promise<ArchitectureRule[]> {
    const rows = await this.client.architectureRule.findMany({
      where: { projectId },
    });
    return rows.map(toRule);
  }

  async upsertRule(
    projectId: string,
    keyType: KeyType | null,
    config: ArchitectureRuleConfig
  ): Promise<ArchitectureRule> {
    const existing = await this.client.architectureRule.findFirst({
      where: {
        projectId,
        keyType: keyType ? toPrismaKeyType(keyType) : null,
      },
    });
    const data = {
      projectId,
      keyType: keyType ? toPrismaKeyType(keyType) : null,
      config,
    };
    const row = existing
      ? await this.client.architectureRule.update({
          where: { id: existing.id },
          data,
        })
      : await this.client.architectureRule.create({ data });
    return toRule(row);
  }

  async replaceOpenFindings(
    projectId: string,
    findings: Array<
      Omit<ArchitectureFinding, 'id' | 'createdAt' | 'status'> & {
        status?: FindingStatus;
      }
    >
  ): Promise<ArchitectureFinding[]> {
    await this.client.architectureFinding.deleteMany({
      where: { projectId, status: 'OPEN' },
    });
    if (!findings.length) {
      return [];
    }
    await this.client.architectureFinding.createMany({
      data: findings.map((finding) => ({
        projectId,
        keyMetaId: finding.keyMetaId,
        kind: kindToPrisma[finding.kind],
        status: statusToPrisma[finding.status ?? 'open'],
        title: finding.title,
        message: finding.message,
        suggestion: finding.suggestion,
      })),
    });
    return this.listFindings(projectId, 'open');
  }

  async listFindings(
    projectId: string,
    status?: FindingStatus
  ): Promise<ArchitectureFinding[]> {
    const rows = await this.client.architectureFinding.findMany({
      where: {
        projectId,
        ...(status ? { status: statusToPrisma[status] } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toFinding);
  }

  async getFinding(id: string): Promise<ArchitectureFinding | null> {
    const row = await this.client.architectureFinding.findUnique({
      where: { id },
    });
    return row ? toFinding(row) : null;
  }

  async updateFindingStatus(
    id: string,
    status: FindingStatus
  ): Promise<ArchitectureFinding> {
    const row = await this.client.architectureFinding.update({
      where: { id },
      data: { status: statusToPrisma[status] },
    });
    return toFinding(row);
  }
}
