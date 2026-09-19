import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import {
  FLAG_RULE_OPERATORS,
  type FlagRuleInput,
  type FlagValue,
  type FlagVisibility,
  type FlagWithConfig,
  type UpsertFlagConfigInput,
} from '../../domain/flags';

type FlagDrawerProps = {
  item: FlagWithConfig;
  canEdit: boolean;
  onClose: () => void;
  onSaveConfig: (patch: UpsertFlagConfigInput & { reason?: string }) => Promise<unknown>;
  onSaveRules: (rules: FlagRuleInput[], reason?: string) => Promise<unknown>;
  onUpdate: (patch: {
    name?: string;
    description?: string;
    visibility?: FlagVisibility;
    archived?: boolean;
  }) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
};

const FlagDrawer = ({
  item,
  canEdit,
  onClose,
  onSaveConfig,
  onSaveRules,
  onUpdate,
  onDelete,
}: FlagDrawerProps) => {
  const { t } = useTranslation('common');
  const [enabled, setEnabled] = useState(item.config.enabled);
  const [defaultValue, setDefaultValue] = useState(
    JSON.stringify(item.config.defaultValue)
  );
  const [offValue, setOffValue] = useState(JSON.stringify(item.config.offValue));
  const [rollout, setRollout] = useState(item.config.rolloutPercentage ?? 100);
  const [useRollout, setUseRollout] = useState(
    item.config.rolloutPercentage !== null
  );
  const [rules, setRules] = useState<FlagRuleInput[]>(
    item.config.rules.map((rule) => ({
      description: rule.description,
      attribute: rule.attribute,
      operator: rule.operator,
      values: rule.values,
      value: rule.value,
      rolloutPercentage: rule.rolloutPercentage,
    }))
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEnabled(item.config.enabled);
    setDefaultValue(JSON.stringify(item.config.defaultValue));
    setOffValue(JSON.stringify(item.config.offValue));
    setRollout(item.config.rolloutPercentage ?? 100);
    setUseRollout(item.config.rolloutPercentage !== null);
    setRules(
      item.config.rules.map((rule) => ({
        description: rule.description,
        attribute: rule.attribute,
        operator: rule.operator,
        values: rule.values,
        value: rule.value,
        rolloutPercentage: rule.rolloutPercentage,
      }))
    );
  }, [item]);

  const parseValue = (raw: string): FlagValue => {
    try {
      return JSON.parse(raw) as FlagValue;
    } catch {
      return raw;
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSaveConfig({
        enabled,
        defaultValue: parseValue(defaultValue),
        offValue: parseValue(offValue),
        rolloutPercentage: useRollout ? rollout : null,
        inherited: false,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      } as UpsertFlagConfigInput & { reason?: string });
      await onSaveRules(rules, reason.trim() || undefined);
      toast.success(t('flag-saved'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('could-not-save-flag')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{item.flag.key}</h3>
            <p className="text-sm text-muted-foreground">{item.flag.name}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} type="button">
            {t('close')}
          </button>
        </div>

        <label className="flex items-center gap-3">
          <input
            checked={enabled}
            className="toggle toggle-primary"
            disabled={!canEdit}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          <span>{t('enabled-in-environment')}</span>
        </label>

        <label className="form-control">
          <span className="label-text">{t('flag-default-value')}</span>
          <input
            className="input input-bordered input-sm font-mono"
            disabled={!canEdit}
            onChange={(event) => setDefaultValue(event.target.value)}
            value={defaultValue}
          />
        </label>
        <label className="form-control">
          <span className="label-text">{t('flag-off-value')}</span>
          <input
            className="input input-bordered input-sm font-mono"
            disabled={!canEdit}
            onChange={(event) => setOffValue(event.target.value)}
            value={offValue}
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            checked={useRollout}
            className="checkbox checkbox-sm"
            disabled={!canEdit}
            onChange={(event) => setUseRollout(event.target.checked)}
            type="checkbox"
          />
          <span>{t('percentage-rollout')}</span>
        </label>
        {useRollout ? (
          <label className="form-control">
            <span className="label-text">{rollout}%</span>
            <input
              className="range range-primary range-sm"
              disabled={!canEdit}
              max={100}
              min={0}
              onChange={(event) => setRollout(Number(event.target.value))}
              type="range"
              value={rollout}
            />
          </label>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{t('targeting-rules')}</h4>
            {canEdit ? (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() =>
                  setRules((current) => [
                    ...current,
                    {
                      attribute: 'email',
                      operator: 'ends-with',
                      values: ['@example.com'],
                      value: item.config.defaultValue,
                    },
                  ])
                }
                type="button"
              >
                {t('add-rule')}
              </button>
            ) : null}
          </div>
          {rules.map((rule, index) => (
            <div
              className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-2"
              key={`${rule.attribute}-${index}`}
            >
              <input
                className="input input-bordered input-sm"
                disabled={!canEdit}
                onChange={(event) =>
                  setRules((current) =>
                    current.map((itemRule, itemIndex) =>
                      itemIndex === index
                        ? { ...itemRule, attribute: event.target.value }
                        : itemRule
                    )
                  )
                }
                placeholder="attribute"
                value={rule.attribute}
              />
              <select
                className="select select-bordered select-sm"
                disabled={!canEdit}
                onChange={(event) =>
                  setRules((current) =>
                    current.map((itemRule, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...itemRule,
                            operator: event.target
                              .value as FlagRuleInput['operator'],
                          }
                        : itemRule
                    )
                  )
                }
                value={rule.operator}
              >
                {FLAG_RULE_OPERATORS.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
              <input
                className="input input-bordered input-sm md:col-span-2"
                disabled={!canEdit}
                onChange={(event) =>
                  setRules((current) =>
                    current.map((itemRule, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...itemRule,
                            values: event.target.value
                              .split(',')
                              .map((value) => value.trim())
                              .filter(Boolean),
                          }
                        : itemRule
                    )
                  )
                }
                placeholder="values, comma separated"
                value={rule.values.join(', ')}
              />
              <input
                className="input input-bordered input-sm font-mono md:col-span-2"
                disabled={!canEdit}
                onChange={(event) =>
                  setRules((current) =>
                    current.map((itemRule, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...itemRule,
                            value: parseValue(event.target.value),
                          }
                        : itemRule
                    )
                  )
                }
                placeholder="rule value (JSON)"
                value={JSON.stringify(rule.value)}
              />
              <label className="form-control md:col-span-2">
                <span className="label-text text-xs">
                  Rule rollout {rule.rolloutPercentage ?? 100}%
                </span>
                <input
                  className="range range-sm"
                  disabled={!canEdit}
                  max={100}
                  min={0}
                  onChange={(event) =>
                    setRules((current) =>
                      current.map((itemRule, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...itemRule,
                              rolloutPercentage: Number(event.target.value),
                            }
                          : itemRule
                      )
                    )
                  }
                  type="range"
                  value={rule.rolloutPercentage ?? 100}
                />
              </label>
              {canEdit ? (
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost btn-xs"
                    disabled={index === 0}
                    onClick={() =>
                      setRules((current) => {
                        const next = [...current];
                        const [moved] = next.splice(index, 1);
                        next.splice(index - 1, 0, moved);
                        return next;
                      })
                    }
                    type="button"
                  >
                    Up
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    disabled={index === rules.length - 1}
                    onClick={() =>
                      setRules((current) => {
                        const next = [...current];
                        const [moved] = next.splice(index, 1);
                        next.splice(index + 1, 0, moved);
                        return next;
                      })
                    }
                    type="button"
                  >
                    Down
                  </button>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() =>
                      setRules((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    type="button"
                  >
                    {t('remove')}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {canEdit ? (
          <label className="form-control">
            <span className="label-text">Change reason (required in production)</span>
            <input
              className="input input-bordered input-sm"
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
          </label>
        ) : null}

        {canEdit ? (
          <div className="flex flex-wrap justify-between gap-2">
            <button
              className="btn btn-error btn-outline btn-sm"
              onClick={async () => {
                if (
                  !window.confirm(
                    t('confirm-delete-flag', { key: item.flag.key })
                  )
                ) {
                  return;
                }
                await onDelete();
                toast.success(t('flag-deleted'));
              }}
              type="button"
            >
              {t('delete')}
            </button>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  void onUpdate({ archived: !item.flag.archived })
                }
                type="button"
              >
                {item.flag.archived ? t('unarchive') : t('archive')}
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={save}
                type="button"
              >
                {busy ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <button className="modal-backdrop" onClick={onClose} type="button">
        {t('close')}
      </button>
    </div>
  );
};

export default FlagDrawer;
