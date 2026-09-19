import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';
import type {
  ArchitectureFinding,
  ArchitectureHealth,
  ArchitectureNode,
  ArchitectureRule,
  ArchitectureRuleConfig,
  FindingKind,
} from '../../domain/architecture';
import { defaultHeaders } from '@/lib/common';
import toast from 'react-hot-toast';

type Payload = {
  health: ArchitectureHealth;
  explorer: ArchitectureNode[];
  findings: ArchitectureFinding[];
  rules: ArchitectureRule[];
};

const FINDING_LABELS: FindingKind[] = [
  'unused-key',
  'stale-flag',
  'unknown-flag',
  'duplicate-translation',
  'overlapping-flags',
  'namespace-inconsistency',
  'missing-owner',
  'missing-description',
  'naming-issue',
  'temporary-flag-overdue',
];

const ArchitectureExplorer = ({
  slug,
  projectId,
  canEdit,
}: {
  slug: string;
  projectId: string;
  canEdit: boolean;
}) => {
  const { t } = useTranslation('common');
  const url = `/api/teams/${slug}/projects/${projectId}/architecture`;
  const { data, mutate } = useSWR<ApiResponse<Payload>>(url, fetcher);
  const [busy, setBusy] = useState(false);
  const payload = data?.data;
  const base = `/teams/${slug}/projects/${projectId}`;
  const ruleConfig = payload?.rules[0]?.config;
  const [allowedRoots, setAllowedRoots] = useState('');
  const [maxDepth, setMaxDepth] = useState(4);
  const [minDepth, setMinDepth] = useState(1);
  const [requiredOwner, setRequiredOwner] = useState(false);
  const [requiredDescription, setRequiredDescription] = useState(false);
  const [staleEnabledDays, setStaleEnabledDays] = useState(90);

  useEffect(() => {
    if (!ruleConfig) {
      return;
    }
    setAllowedRoots((ruleConfig.allowedRootNamespaces ?? []).join(', '));
    setMaxDepth(ruleConfig.maxDepth ?? 4);
    setMinDepth(ruleConfig.minDepth ?? 1);
    setRequiredOwner(Boolean(ruleConfig.requiredOwner));
    setRequiredDescription(Boolean(ruleConfig.requiredDescription));
    setStaleEnabledDays(ruleConfig.staleEnabledDays ?? 90);
  }, [ruleConfig]);

  const analyze = async () => {
    setBusy(true);
    try {
      await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ analyze: true }),
      });
      await mutate();
      toast.success(t('architecture-analyzed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('analyze-failed'));
    } finally {
      setBusy(false);
    }
  };

  const saveRules = async () => {
    const config: ArchitectureRuleConfig = {
      allowedRootNamespaces: allowedRoots
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      maxDepth,
      minDepth,
      requiredOwner,
      requiredDescription,
      staleEnabledDays,
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error(t('save-failed'));
    }
    await mutate();
    toast.success(t('saved'));
  };

  const setFinding = async (
    id: string,
    status: ArchitectureFinding['status']
  ) => {
    await fetch(`${url}/${id}`, {
      method: 'PATCH',
      headers: defaultHeaders,
      body: JSON.stringify({ status }),
    });
    await mutate();
  };

  const cleanup = async (id: string) => {
    const response = await fetch(`${url}/${id}`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ action: 'cleanup' }),
    });
    if (!response.ok) {
      const json = (await response.json()) as { error?: { message?: string } };
      throw new Error(json.error?.message ?? t('migration-failed'));
    }
    await mutate();
    toast.success(t('cleanup-migration-created'));
  };

  const openFindings = FINDING_LABELS.filter(
    (kind) => (payload?.health.findings[kind] ?? 0) > 0
  );
  const openCount = openFindings.reduce(
    (sum, kind) => sum + (payload?.health.findings[kind] ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('architecture')}</h1>
          <p className="text-sm text-muted-foreground">{t('architecture-help')}</p>
        </div>
        {canEdit ? (
          <button
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={analyze}
            type="button"
          >
            {busy ? t('analyzing') : t('analyze-architecture')}
          </button>
        ) : null}
      </div>

      {payload ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t('open-findings')} value={openCount} />
          {openFindings.map((kind) => (
            <Stat
              key={kind}
              label={kind.replace(/-/g, ' ')}
              value={payload.health.findings[kind]}
            />
          ))}
        </div>
      ) : null}

      {canEdit ? (
        <section className="space-y-3 rounded-md bg-card p-4">
          <h2 className="font-semibold">{t('architecture-rules')}</h2>
          <label className="form-control">
            <span className="label-text">{t('allowed-root-namespaces')}</span>
            <input
              className="input input-bordered input-sm"
              onChange={(event) => setAllowedRoots(event.target.value)}
              placeholder="billing, checkout, settings"
              value={allowedRoots}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="form-control">
              <span className="label-text">{t('max-namespace-depth')}</span>
              <input
                className="input input-bordered input-sm w-24"
                min={1}
                onChange={(event) => setMaxDepth(Number(event.target.value))}
                type="number"
                value={maxDepth}
              />
            </label>
            <label className="form-control">
              <span className="label-text">{t('min-namespace-depth')}</span>
              <input
                className="input input-bordered input-sm w-24"
                min={0}
                onChange={(event) => setMinDepth(Number(event.target.value))}
                type="number"
                value={minDepth}
              />
            </label>
            <label className="form-control">
              <span className="label-text">{t('stale-flag-days')}</span>
              <input
                className="input input-bordered input-sm w-24"
                min={1}
                onChange={(event) =>
                  setStaleEnabledDays(Number(event.target.value))
                }
                type="number"
                value={staleEnabledDays}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={requiredOwner}
              className="checkbox checkbox-sm"
              onChange={(event) => setRequiredOwner(event.target.checked)}
              type="checkbox"
            />
            {t('require-owner')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={requiredDescription}
              className="checkbox checkbox-sm"
              onChange={(event) => setRequiredDescription(event.target.checked)}
              type="checkbox"
            />
            {t('require-description')}
          </label>
          <button
            className="btn btn-sm"
            onClick={() =>
              void saveRules().catch((error) =>
                toast.error(error instanceof Error ? error.message : t('save-failed'))
              )
            }
            type="button"
          >
            {t('save-rules')}
          </button>
        </section>
      ) : null}

      <section className="rounded-md bg-card p-4">
        <h2 className="mb-3 font-semibold">{t('findings')}</h2>
        <ul className="space-y-3">
          {(payload?.findings ?? []).map((finding) => (
            <li className="rounded border border-border p-3" key={finding.id}>
              <p className="font-medium">{finding.title}</p>
              <p className="text-sm text-muted-foreground">{finding.message}</p>
              {finding.suggestion ? (
                <p className="mt-1 text-sm">{finding.suggestion}</p>
              ) : null}
              {canEdit ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['reviewed', 'ignored', 'intentional'] as const).map(
                    (status) => (
                      <button
                        className="btn btn-ghost btn-xs"
                        key={status}
                        onClick={() => void setFinding(finding.id, status)}
                        type="button"
                      >
                        {status}
                      </button>
                    )
                  )}
                  {finding.keyMetaId ? (
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() =>
                        void cleanup(finding.id).catch((error) =>
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : t('migration-failed')
                          )
                        )
                      }
                      type="button"
                    >
                      {t('create-cleanup-migration')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
          {!payload?.findings.length ? (
            <p className="text-sm text-muted-foreground">{t('no-findings')}</p>
          ) : null}
        </ul>
      </section>

      <section className="rounded-md bg-card p-4">
        <h2 className="mb-3 font-semibold">{t('architecture-explorer')}</h2>
        <Tree nodes={payload?.explorer ?? []} base={base} />
      </section>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-card p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Tree({
  nodes,
  base,
}: {
  nodes: ArchitectureNode[];
  base: string;
}) {
  return (
    <ul className="space-y-3">
      {nodes.map((node) => (
        <li key={node.namespace}>
          <p className="font-mono text-sm font-semibold">{node.namespace}</p>
          <ul className="ml-4 mt-1 space-y-1 text-xs">
            {node.translations.map((item) => (
              <li key={item.id}>
                <Link className="link link-hover" href={`${base}/keys/${item.id}`}>
                  translation · {item.key}
                </Link>
              </li>
            ))}
            {node.flags.map((item) => (
              <li key={item.id}>
                <Link className="link link-hover" href={`${base}/keys/${item.id}`}>
                  flag · {item.key}
                </Link>
              </li>
            ))}
          </ul>
          {node.children.length ? (
            <div className="ml-4 mt-2">
              <Tree base={base} nodes={node.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default ArchitectureExplorer;
