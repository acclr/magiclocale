import type { Environment } from '../../domain/environments';
import { useTranslation } from '@/hooks/useTranslation';

type EnvironmentSwitcherProps = {
  environments: Environment[];
  currentSlug?: string;
  onChange: (slug: string) => void;
};

const EnvironmentSwitcher = ({
  environments,
  currentSlug,
  onChange,
}: EnvironmentSwitcherProps) => {
  const { t } = useTranslation('common');
  const selected =
    environments.find((environment) => environment.slug === currentSlug) ??
    environments.find((environment) => environment.isProduction) ??
    environments[0];

  if (!environments.length) {
    return null;
  }

  return (
    <label className="flex w-full flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{t('environment')}</span>
      <select
        className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={selected?.slug ?? 'production'}
        onChange={(event) => onChange(event.target.value)}
      >
        {environments.map((environment) => (
          <option key={environment.id} value={environment.slug}>
            {environment.isProduction
              ? `${environment.name} (${t('version-live')})`
              : environment.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default EnvironmentSwitcher;
