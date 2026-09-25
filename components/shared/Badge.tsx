import type { ComponentProps } from 'react';
import { cn } from 'cn';

import { Badge as BadgeUi } from '@/components/ui/badge';

type BadgeProps = ComponentProps<typeof BadgeUi> & {
  color?: string;
};

const Badge = ({
  children,
  className,
  color,
  variant,
  ...props
}: BadgeProps) => {
  const mappedVariant =
    variant ??
    (color === 'error' || color === 'warning'
      ? 'destructive'
      : color === 'secondary'
        ? 'secondary'
        : color === 'outline'
          ? 'outline'
          : 'default');

  return (
    <BadgeUi
      {...props}
      variant={mappedVariant}
      className={cn('rounded-md', className)}
    >
      {children}
    </BadgeUi>
  );
};

export default Badge;
