import { getLocaleDisplay } from '../../../domain/translations';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';

type RetranslateConfirmDialogProps = {
  /** Dialog is open while a source language is chosen. */
  fromLocale: string | null;
  /** Languages the rewrite can start from, including the project source. */
  sourceChoices: string[];
  keyCount: number;
  locales: string[];
  onConfirm: (fromLocale: string) => void;
  onCancel: () => void;
};

const RetranslateConfirmDialog = ({
  fromLocale,
  sourceChoices,
  keyCount,
  locales,
  onConfirm,
  onCancel,
}: RetranslateConfirmDialogProps) => {
  const { t } = useTranslation('common');
  const [from, setFrom] = useState(fromLocale ?? '');

  useEffect(() => {
    if (fromLocale) {
      setFrom(fromLocale);
    }
  }, [fromLocale]);

  return (
    <Dialog
      onOpenChange={(open) => !open && onCancel()}
      open={fromLocale !== null}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('queue-retranslate')}</DialogTitle>
          <DialogDescription>
            {from &&
              t('confirm-queue-retranslate', {
                keys: String(keyCount),
                locales: locales.join(', '),
                from: getLocaleDisplay(from).label,
              })}
          </DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-1.5 text-sm">
          <span>{t('retranslate-from')}</span>
          <select
            className="select select-bordered"
            onChange={(event) => setFrom(event.target.value)}
            value={from}
          >
            {sourceChoices.map((locale) => {
              const display = getLocaleDisplay(locale);
              return (
                <option key={locale} value={locale}>
                  {display.label}
                </option>
              );
            })}
          </select>
        </label>
        <DialogFooter>
          <Button onClick={onCancel} type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button onClick={() => from && onConfirm(from)} type="button">
            {t('queue-retranslate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RetranslateConfirmDialog;
