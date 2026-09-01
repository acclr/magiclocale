import type {
  TranslationSource,
  TranslationStatus,
} from '../../domain/translations';
import { useTranslation } from 'next-i18next';

type StatusBadgeProps = {
  missing?: boolean;
  source?: TranslationSource | null;
  status?: TranslationStatus | 'missing';
};

const styles = {
  missing: 'badge-warning',
  'needs-review': 'badge-error',
  manual: 'badge-success',
  source: 'badge-neutral',
  ai: 'badge-info',
};

const StatusBadge = ({ missing, source, status }: StatusBadgeProps) => {
  const { t } = useTranslation('common');
  const value = missing
    ? 'missing'
    : status === 'needs-review'
      ? 'needs-review'
      : status === 'source' || source === 'code'
        ? 'source'
        : source;
  const normalized = value ?? 'missing';
  const label = {
    missing: t('translation-status-missing'),
    'needs-review': t('translation-status-needs-review'),
    manual: t('translation-status-manual'),
    source: t('translation-status-source'),
    ai: t('translation-status-ai'),
  }[normalized];

  return (
    <span className={`badge badge-sm badge-outline ${styles[normalized]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
