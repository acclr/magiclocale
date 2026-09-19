import type { DashboardCell } from '../../domain/translations';
import type { CellSaveOptions } from './CellDrafts';
import { useCellDrafts } from './CellDrafts';
import {
  CheckIcon,
  CodeBracketIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { BotIcon, UserIcon } from 'lucide-react';

const COLLAPSED_CELL_PX = 80;

type TranslationCellProps = {
  keyId: string;
  cell: DashboardCell;
  fallbackValue?: string;
  canEdit: boolean;
  onOpen: () => void;
  onSave: (value: string, options?: CellSaveOptions) => Promise<unknown>;
};

type StatusKey = 'missing' | 'needs-review' | 'manual' | 'source' | 'ai';

const iconStyles: Record<StatusKey, string> = {
  missing: 'text-amber-400',
  'needs-review': 'text-destructive',
  manual: 'text-emerald-400',
  source: 'text-muted-foreground',
  ai: 'text-sky-400',
};

const icons: Record<StatusKey, typeof PencilSquareIcon> = {
  missing: ExclamationCircleIcon,
  'needs-review': ExclamationTriangleIcon,
  manual: UserIcon,
  source: CodeBracketIcon,
  ai: BotIcon,
};

const TranslationCell = ({
  keyId,
  cell,
  fallbackValue = '',
  canEdit,
  onOpen,
  onSave,
}: TranslationCellProps) => {
  const { t } = useTranslation('common');
  const drafts = useCellDrafts();
  const persistedValue = cell.value ?? fallbackValue;
  const [baseline, setBaseline] = useState(persistedValue);
  const [value, setValue] = useState(persistedValue);
  const [isSaving, setIsSaving] = useState(false);
  const valueRef = useRef(value);
  const baselineRef = useRef(baseline);
  const isDirtyRef = useRef(false);
  const draftsRef = useRef(drafts);
  const draftId = `${keyId}:${cell.locale}`;
  const isDirty = canEdit && value !== baseline;

  valueRef.current = value;
  baselineRef.current = baseline;
  isDirtyRef.current = isDirty;
  draftsRef.current = drafts;

  useEffect(() => {
    if (isDirtyRef.current) {
      return;
    }
    setBaseline(persistedValue);
    setValue(persistedValue);
  }, [persistedValue]);

  const save = async (options?: CellSaveOptions) => {
    if (!canEdit || isSaving || valueRef.current === baselineRef.current) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(valueRef.current, options);
      setBaseline(valueRef.current);
      if (!options?.silent) {
        toast.success(t('translation-saved'));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('could-not-save-translation')
      );
      setValue(baselineRef.current);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const discard = () => {
    setValue(baselineRef.current);
  };

  const saveRef = useRef(save);
  const discardRef = useRef(discard);
  saveRef.current = save;
  discardRef.current = discard;

  useEffect(() => {
    if (!isDirty) {
      draftsRef.current.unregister(draftId);
      return;
    }

    draftsRef.current.register(draftId, {
      save: (options) => saveRef.current(options),
      discard: () => discardRef.current(),
    });
    return () => draftsRef.current.unregister(draftId);
  }, [draftId, isDirty]);


  const statusValue = cell.missing
    ? 'missing'
    : cell.status === 'needs-review'
      ? 'needs-review'
      : cell.status === 'source' || cell.source === 'code'
        ? 'source'
        : cell.source;
  const normalized: StatusKey = statusValue ?? 'missing';
  const statusLabels: Record<StatusKey, string> = {
    missing: t('translation-status-missing'),
    'needs-review': t('translation-status-needs-review'),
    manual: t('translation-status-manual'),
    source: t('translation-status-source'),
    ai: t('translation-status-ai'),
  };
  const statusLabel = statusLabels[normalized];

  const StatusIcon = icons[normalized];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const isExpanded = isFocused && isOverflowing;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    setIsOverflowing(textarea.scrollHeight > COLLAPSED_CELL_PX);
  }, [value, isFocused]);

  return (
    <div
      className={cn(
        'group relative flex h-full min-h-full w-full min-w-96 flex-1 flex-row hover:ring-primary/40 focus-within:ring-2 focus-within:ring-primary/40',
        isExpanded
          ? 'hover:bg-[#222] focus-within:bg-[#222]'
          : 'hover:bg-foreground/5 focus-within:bg-foreground/10',
        isOverflowing &&
          !isExpanded &&
          "overflow-hidden after:pointer-events-none after:absolute after:bottom-0 after:z-10 after:h-5 after:w-full after:bg-linear-to-t after:from-black/70 after:to-transparent after:opacity-50 after:content-['']",
        isExpanded &&
          'absolute top-0 left-0 z-30 min-h-48 min-w-[32rem] bg-card shadow-xl ring-1 ring-border'
      )}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
      onFocus={() => setIsFocused(true)}
    >
      <textarea
        aria-label={`${cell.locale} translation`}
        className={cn(
          'textarea textarea-sm min-h-full! h-16 flex-1 resize-none border-none bg-transparent py-2.5 opacity-60 hover:opacity-100 focus:opacity-100 focus:ring-0 focus:outline-0',
          isExpanded ? 'min-h-40 overflow-auto' : 'max-h-20 overflow-hidden'
        )}
        disabled={!canEdit || isSaving || drafts.isSavingAll}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            void save();
          }
        }}
        placeholder="Add translation…"
        ref={textareaRef}
        rows={2}
        value={value}
      />
      <div className="flex p-0.5 justify-start opacity-30 group-hover:opacity-100 min-w-7 flex-col w-max items-center">
        {!isDirty && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center rounded-md hover:bg-foreground/5 justify-center p-1 w-full"
                  onClick={onOpen}
                  type="button"
                >
                  <StatusIcon
                    className={cn('w-[16px] h-[16px]', iconStyles[normalized])}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{statusLabel}</TooltipContent>
            </Tooltip>
          </>
        )}
        {isDirty && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center rounded-md hover:bg-foreground/5 justify-center p-1 w-full"
                  onClick={discard}
                >
                  <XMarkIcon />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{t('discard-cell')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center rounded-md hover:bg-foreground/5 justify-center p-1 w-full"
                  onClick={() => void save()}
                >
                  <CheckIcon />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{t('save-cell')}</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
};

export default TranslationCell;
