import type { ProjectService } from '../translations/project-service';
import { namespaceFromKey } from './namespace';
import { parseSearchQuery } from './search';
import type { KeyCatalogRepository } from './repository';
import type {
  CatalogList,
  CatalogQuery,
  DetectedKeyInput,
  KeyLifecycle,
  KeyMeta,
  KeyMetaPatch,
  KeyType,
  SourceUsage,
} from './types';

export class KeyCatalogService {
  constructor(
    private readonly repository: KeyCatalogRepository,
    private readonly projectService: ProjectService
  ) {}

  async list(
    teamId: string,
    projectId: string,
    query: CatalogQuery = {}
  ): Promise<CatalogList> {
    const project = await this.projectService.get(teamId, projectId);
    const parsed = parseSearchQuery(query.search ?? '');
    return this.repository.list(project.id, {
      ...query,
      search: parsed.text || query.search,
      type:
        query.type && query.type !== 'all'
          ? query.type
          : parseType(parsed.fields.type),
      lifecycle:
        query.lifecycle && query.lifecycle !== 'all'
          ? query.lifecycle
          : parseLifecycle(parsed.fields.lifecycle ?? parsed.fields.status),
      namespace: query.namespace ?? parsed.fields.namespace,
      owner: query.owner ?? parsed.fields.owner,
      usage:
        query.usage ??
        (parsed.fields.usage !== undefined
          ? Number(parsed.fields.usage)
          : undefined),
      file: query.file ?? parsed.fields.file,
    });
  }

  async get(teamId: string, projectId: string, keyMetaId: string) {
    const project = await this.projectService.get(teamId, projectId);
    const meta = await this.repository.get(keyMetaId);
    if (!meta || meta.projectId !== project.id) {
      throw new Error(`Key not found: ${keyMetaId}`);
    }
    const usages = await this.repository.listUsages(meta.id);
    return { meta, usages };
  }

  async getByKey(
    teamId: string,
    projectId: string,
    type: KeyType,
    key: string
  ): Promise<{ meta: KeyMeta; usages: SourceUsage[] }> {
    const project = await this.projectService.get(teamId, projectId);
    const meta = await this.repository.findByKey(project.id, type, key);
    if (!meta) {
      throw new Error(`Key not found: ${key}`);
    }
    const usages = await this.repository.listUsages(meta.id);
    return { meta, usages };
  }

  async update(
    teamId: string,
    projectId: string,
    keyMetaId: string,
    patch: KeyMetaPatch
  ): Promise<KeyMeta> {
    const { meta } = await this.get(teamId, projectId, keyMetaId);
    return this.repository.update(meta.id, patch);
  }

  async recordDetection(input: DetectedKeyInput): Promise<KeyMeta> {
    return this.repository.recordDetection({
      ...input,
      key: input.key.trim(),
    });
  }

  async upsertDefinition(input: {
    projectId: string;
    type: KeyType;
    key: string;
    description?: string | null;
    lifecycle?: KeyLifecycle;
  }): Promise<KeyMeta> {
    return this.repository.upsert(input);
  }

  async rename(
    teamId: string,
    projectId: string,
    type: KeyType,
    fromKey: string,
    toKey: string
  ): Promise<KeyMeta> {
    const project = await this.projectService.get(teamId, projectId);
    return this.repository.rename(project.id, type, fromKey, toKey.trim());
  }
}

export { namespaceFromKey };

function parseType(value?: string): KeyType | 'all' | undefined {
  if (!value) {
    return undefined;
  }
  if (value === 'flag' || value === 'feature-flag' || value === 'featureflag') {
    return 'feature-flag';
  }
  if (value === 'translation') {
    return 'translation';
  }
  return undefined;
}

function parseLifecycle(value?: string): KeyLifecycle | 'all' | undefined {
  if (!value) {
    return undefined;
  }
  if (
    value === 'active' ||
    value === 'unused' ||
    value === 'deprecated' ||
    value === 'archived'
  ) {
    return value;
  }
  return undefined;
}
