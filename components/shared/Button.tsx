import * as React from 'react';
import { cn } from 'cn';

import { Button as UiButton } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type DaisyColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'ghost'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

type DaisyVariant = 'outline' | 'link';
type DaisySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = Omit<React.ComponentProps<typeof UiButton>, 'size'> & {
  color?: DaisyColor;
  size?: React.ComponentProps<typeof UiButton>['size'] | DaisySize;
  loading?: boolean;
  fullWidth?: boolean;
  wide?: boolean;
  active?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children?: React.ReactNode;
};

const mapVariant = (
  color?: DaisyColor,
  variant?: ButtonProps['variant'] | DaisyVariant
): React.ComponentProps<typeof UiButton>['variant'] => {
  if (variant === 'outline' || variant === 'link' || variant === 'ghost') {
    return variant;
  }
  if (color === 'error') {
    return 'destructive';
  }
  if (color === 'secondary') {
    return 'secondary';
  }
  if (color === 'ghost') {
    return 'ghost';
  }
  return variant ?? 'default';
};

const mapSize = (
  size?: ButtonProps['size'] | DaisySize
): React.ComponentProps<typeof UiButton>['size'] => {
  if (size === 'md') {
    return 'default';
  }
  return size ?? 'default';
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      color,
      variant,
      size,
      loading,
      fullWidth,
      wide,
      active,
      startIcon,
      endIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <UiButton
        ref={ref}
        variant={mapVariant(color, variant)}
        size={mapSize(size)}
        disabled={disabled || loading}
        aria-pressed={active}
        className={cn((fullWidth || wide) && 'w-full', className)}
        {...props}
      >
        {loading ? <Spinner data-icon="inline-start" /> : startIcon}
        {children}
        {endIcon}
      </UiButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
