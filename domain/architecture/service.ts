import type { FlagRepository } from '../flags/repository';
import type { EnvironmentService } from '../environments/environment-service';
import type { KeyCatalogRepository } from '../keys/repository';
import type { KeyMeta, SourceUsage } from '../keys/types';
import { namespaceFromKey } from '../keys/namespace';
import type { ProjectService } from '../translations/project-service';
import type { TranslationRepository } from '../translations/repository';
import { analyzeArchitecture } from './analyzer';
import { cleanupOperationsForFinding } from './cleanup';
import type { ArchitectureRepository } from './repository';
import {
  DEFAULT_ARCHITECTURE_RULES,
  type ArchitectureFinding,
  type ArchitectureHealth,
  type ArchitectureNode,
  type ArchitectureRuleConfig,
  type FindingKind,
  type FindingStatus,
} from './types';

export class ArchitectureService {
  constructor(
    private readonly repository: ArchitectureRepository,
    private readonly keys: KeyCatalogRepository,
    private readonly translations: TranslationRepository,
    private readonly flags: FlagRepository,
    private readonly projectService: ProjectService,
    private readonly environmentService: EnvironmentService
  ) {}

  async getRules(teamId: string, projectId: string) {
    const project = await this.projectService.get(teamId, projectId);
    const rules = await this.repository.listRules(project.id);
    return rules.length
      ? rules
      : [
          {
            id: 'default',
            projectId: project.id,
            keyType: null,
            config: DEFAULT_ARCHITECTURE_RULES,
          },
        ];
  }

  async saveRules(
    teamId: string,
    projectId: string,
    config: ArchitectureRuleConfig,
    keyType: 'translation' | 'feature-flag' | null = null
  ) {
    const project = await this.projectService.get(teamId, projectId);
    return this.repository.upsertRule(project.id, keyType, {
      ...DEFAULT_ARCHITECTURE_RULES,
      ...config,
    });
  }

  async analyze(teamId: string, projectId: string) {
    const project = await this.projectService.get(teamId, projectId);
    const [keys, rules, translationKeys, flags] = await Promise.all([
      this.keys.listAll(project.id),
      this.repository.listRules(project.id),
      this.translations.listKeys(project.id),
      this.flags.listFlags(project.id),
    ]);
    const config = {
      ...DEFAULT_ARCHITECTURE_RULES,
      ...(rules[0]?.config ?? {}),
    };
    const usagesByKeyId: Record<string, SourceUsage[]> = {};
    for (const key of keys) {
      usagesByKeyId[key.id] = await this.keys.listUsages(key.id);
    }
    const translationSourceText = Object.fromEntries(
      translationKeys.map((item) => [item.key, item.sourceText])
    );
    const definedFlagKeys = new Set(flags.map((flag) => flag.key));
    const productionEnabledSince: Record<string, Date | null> = {};
    const productionDisabledSince: Record<string, Date | null> = {};
    const production = (
      await this.environmentService.listForProject(project.id)
    ).find((environment) => environment.isProduction);
    if (production) {
      const configs = await this.flags.listConfigsForEnvironment(production.id);
      const flagsById = Object.fromEntries(
        flags.map((flag) => [flag.id, flag])
      );
      for (const config of configs) {
        const flag = flagsById[config.flagId];
        if (!flag) {
          continue;
        }
        if (config.enabled) {
          productionEnabledSince[flag.key] = config.updatedAt ?? null;
        } else {
          productionDisabledSince[flag.key] = config.updatedAt ?? null;
        }
      }
    }
    const findings = analyzeArchitecture({
      keys,
      usagesByKeyId,
      translationSourceText,
      definedFlagKeys,
      productionEnabledSince,
      productionDisabledSince,
      rules: config,
    });
    for (const key of keys) {
      if (key.lifecycle === 'deprecated' || key.lifecycle === 'archived') {
        continue;
      }
      if (key.usageCount === 0 && key.lifecycle !== 'unused') {
        await this.keys.update(key.id, { lifecycle: 'unused' });
      } else if (key.usageCount > 0 && key.lifecycle === 'unused') {
        await this.keys.update(key.id, { lifecycle: 'active' });
      }
    }
    return this.repository.replaceOpenFindings(project.id, findings);
  }

  async getFinding(teamId: string, projectId: string, findingId: string) {
    const project = await this.projectService.get(teamId, projectId);
    const finding = await this.repository.getFinding(findingId);
    if (!finding || finding.projectId !== project.id) {
      throw new Error(`Finding not found: ${findingId}`);
    }
    return finding;
  }

  async cleanupOperations(
    teamId: string,
    projectId: string,
    findingId: string
  ) {
    const finding = await this.getFinding(teamId, projectId, findingId);
    if (!finding.keyMetaId) {
      throw new Error('This finding is not attached to a key');
    }
    const meta = await this.keys.get(finding.keyMetaId);
    if (!meta) {
      throw new Error('Key not found for this finding');
    }
    const operation = cleanupOperationsForFinding(finding, meta);
    if (!operation) {
      throw new Error('This finding does not have an automatic cleanup action');
    }
    return { finding, meta, operation };
  }

  async listFindings(
    teamId: string,
    projectId: string,
    status?: FindingStatus
  ) {
    const project = await this.projectService.get(teamId, projectId);
    return this.repository.listFindings(project.id, status);
  }

  async updateFinding(
    teamId: string,
    projectId: string,
    findingId: string,
    status: FindingStatus
  ): Promise<ArchitectureFinding> {
    await this.projectService.get(teamId, projectId);
    return this.repository.updateFindingStatus(findingId, status);
  }

  async health(teamId: string, projectId: string): Promise<ArchitectureHealth> {
    const project = await this.projectService.get(teamId, projectId);
    const [keys, findings] = await Promise.all([
      this.keys.listAll(project.id),
      this.repository.listFindings(project.id, 'open'),
    ]);
    const counts = emptyFindingCounts();
    for (const finding of findings) {
      counts[finding.kind] += 1;
    }
    return {
      totalKeys: keys.length,
      translations: keys.filter((key) => key.type === 'translation').length,
      featureFlags: keys.filter((key) => key.type === 'feature-flag').length,
      findings: counts,
    };
  }

  async explorer(
    teamId: string,
    projectId: string
  ): Promise<ArchitectureNode[]> {
    const project = await this.projectService.get(teamId, projectId);
    const keys = await this.keys.listAll(project.id);
    return buildTree(keys);
  }
}

function emptyFindingCounts(): Record<FindingKind, number> {
  return {
    'unused-key': 0,
    'stale-flag': 0,
    'duplicate-translation': 0,
    'overlapping-flags': 0,
    'namespace-inconsistency': 0,
    'missing-owner': 0,
    'missing-description': 0,
    'naming-issue': 0,
    'unknown-flag': 0,
    'temporary-flag-overdue': 0,
  };
}

function buildTree(keys: KeyMeta[]): ArchitectureNode[] {
  const roots = new Map<string, ArchitectureNode>();

  const ensure = (parts: string[]): ArchitectureNode => {
    const namespace = parts.join('.');
    if (parts.length === 1) {
      const existing = roots.get(namespace);
      if (existing) {
        return existing;
      }
      const created: ArchitectureNode = {
        namespace,
        translations: [],
        flags: [],
        children: [],
      };
      roots.set(namespace, created);
      return created;
    }
    const parent = ensure(parts.slice(0, -1));
    const existing = parent.children.find(
      (child) => child.namespace === namespace
    );
    if (existing) {
      return existing;
    }
    const created: ArchitectureNode = {
      namespace,
      translations: [],
      flags: [],
      children: [],
    };
    parent.children.push(created);
    return created;
  };

  for (const key of keys) {
    const namespace = key.namespace ?? namespaceFromKey(key.key) ?? key.key;
    const parts = namespace.split('.').filter(Boolean);
    const node = ensure(parts.length ? parts : [key.key]);
    const entry = { id: key.id, key: key.key };
    if (key.type === 'feature-flag') {
      node.flags.push(entry);
    } else {
      node.translations.push(entry);
    }
  }

  return Array.from(roots.values());
}
