import type { LocaleFormat } from '../../domain/translations';
import {
  getLocaleDisplay,
  matchCatalogLocale,
  searchLocales,
} from '../../domain/translations';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import LocaleFlag from './LocaleFlag';
import LocaleName from './LocaleName';

type LocaleSelectProps = {
  value: string;
  onChange: (locale: string) => void;
  format: LocaleFormat | 'any';
  exclude?: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  size?: 'sm' | 'md';
};

const LocaleSelect = ({
  value,
  onChange,
  format,
  exclude = [],
  placeholder,
  disabled = false,
  required = false,
  id,
  size = 'sm',
}: LocaleSelectProps) => {
  const { t } = useTranslation('common');
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = value ? getLocaleDisplay(value) : undefined;

  const options = useMemo(
    () => searchLocales(open ? query : '', format, exclude),
    [exclude, format, open, query]
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const commit = (code: string) => {
    onChange(code);
    setQuery('');
    setOpen(false);
  };

  const displayValue = open ? query : selected ? selected.label : '';

  return (
    <div className="relative w-full min-w-64" ref={rootRef}>
      {selected?.countryCode && !open ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center"
        >
          <LocaleFlag countryCode={selected.countryCode} size="sm" />
        </span>
      ) : null}
      <input
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        autoComplete="off"
        className={`input input-bordered w-full ${size === 'sm' ? 'input-sm' : ''} ${
          selected?.countryCode && !open ? 'pl-10' : ''
        }`}
        disabled={disabled}
        id={inputId}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setOpen(true);
          const exact = matchCatalogLocale(nextQuery, format, exclude);
          if (exact) {
            onChange(exact.code);
            return;
          }
          if (value) {
            onChange('');
          }
        }}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') {
            return;
          }
          event.preventDefault();
          const exact = matchCatalogLocale(query, format, exclude);
          const next = exact ?? options[0];
          if (next) {
            commit(next.code);
          }
        }}
        placeholder={placeholder ?? t('locale-search-placeholder')}
        required={required && !value}
        role="combobox"
        value={displayValue}
      />
      {open && (
        <ul
          className="absolute z-30 mt-1 flex max-h-72 w-full flex-col overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg"
          id={listId}
          role="listbox"
        >
          {options.length ? (
            options.slice(0, 80).map((option) => (
              <li className="w-full" key={option.code} role="presentation">
                <button
                  aria-selected={option.code === value}
                  className={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${
                    option.code === value ? 'bg-muted' : ''
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(option.code)}
                  role="option"
                  type="button"
                >
                  <LocaleName
                    code={option.code}
                    option={option}
                    variant="full"
                  />
                </button>
              </li>
            ))
          ) : (
            <li className="px-2 py-1.5 text-sm text-muted-foreground">
              <span>{t('locale-no-matches')}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default LocaleSelect;
