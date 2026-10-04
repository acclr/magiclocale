import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type CollapsibleSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Icon until opened; stays expanded while a query is present. */
const CollapsibleSearch = ({ value, onChange }: CollapsibleSearchProps) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expanded = open || value.length > 0;
  const label = t('search-translations');

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  if (!expanded) {
    return (
      <Button
        aria-label={label}
        onClick={() => setOpen(true)}
        size="icon"
        title={label}
        type="button"
        variant="outline"
      >
        <SearchIcon />
      </Button>
    );
  }

  return (
    <div className="relative">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        aria-label={label}
        className="input input-bordered w-48 pr-2.5 pl-8 sm:w-64"
        onBlur={() => {
          if (!value) {
            setOpen(false);
          }
        }}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (value) {
              onChange('');
            }
            setOpen(false);
            event.currentTarget.blur();
          }
        }}
        placeholder={label}
        ref={inputRef}
        type="search"
        value={value}
      />
    </div>
  );
};

export default CollapsibleSearch;
