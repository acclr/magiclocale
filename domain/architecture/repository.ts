import type { ArchitectureFinding, ArchitectureRule } from './types';
import type { FindingStatus } from './types';

export interface ArchitectureRepository {
  listRules(projectId: string): Promise<ArchitectureRule[]>;
  upsertRule(
    projectId: string,
    keyType: ArchitectureRule['keyType'],
    config: ArchitectureRule['config']
  ): Promise<ArchitectureRule>;
  replaceOpenFindings(
    projectId: string,
    findings: Array<
      Omit<ArchitectureFinding, 'id' | 'createdAt' | 'status'> & {
        status?: FindingStatus;
      }
    >
  ): Promise<ArchitectureFinding[]>;
  listFindings(
    projectId: string,
    status?: FindingStatus
  ): Promise<ArchitectureFinding[]>;
  getFinding(id: string): Promise<ArchitectureFinding | null>;
  updateFindingStatus(
    id: string,
    status: FindingStatus
  ): Promise<ArchitectureFinding>;
}
