import type {
  TranslationSource,
  TranslationStatus,
} from '../../domain/translations';
import {
  CodeBracketIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';

type StatusKey = 'missing' | 'needs-review' | 'manual' | 'source' | 'ai';

type StatusBadgeProps = {
  missing?: boolean;
  source?: TranslationSource | null;
  status?: TranslationStatus | 'missing';
  variant?: 'label' | 'icon';
};

const styles: Record<StatusKey, string> = {
  missing: 'badge-warning',
  'needs-review': 'badge-error',
  manual: 'badge-success',
  source: 'badge-neutral',
  ai: 'badge-info',
};

const icons: Record<StatusKey, typeof PencilSquareIcon> = {
  missing: ExclamationCircleIcon,
  'needs-review': ExclamationTriangleIcon,
  manual: PencilSquareIcon,
  source: CodeBracketIcon,
  ai: SparklesIcon,
};

const StatusBadge = ({
  missing,
  source,
  status,
  variant = 'label',
}: StatusBadgeProps) => {
  const { t } = useTranslation('common');
  const value = missing
    ? 'missing'
    : status === 'needs-review'
      ? 'needs-review'
      : status === 'source' || source === 'code'
        ? 'source'
        : source;
  const normalized: StatusKey = value ?? 'missing';
  const label = {
    missing: t('translation-status-missing'),
    'needs-review': t('translation-status-needs-review'),
    manual: t('translation-status-manual'),
    source: t('translation-status-source'),
    ai: t('translation-status-ai'),
  }[normalized];

  if (variant === 'icon') {
    const Icon = icons[normalized];
    return (
      <Tooltip>
        <TooltipTrigger aria-label={label}>
          <Icon className="w-5 h-5" />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <span className={`badge badge-sm badge-outline ${styles[normalized]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
