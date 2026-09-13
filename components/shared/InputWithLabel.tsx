import type { ComponentProps, ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputWithLabelProps extends ComponentProps<typeof Input> {
  label: string | ReactNode;
  error?: string;
  descriptionText?: string;
}

const InputWithLabel = (props: InputWithLabelProps) => {
  const { label, error, descriptionText, className, ...rest } = props;

  return (
    <div className="grid w-full gap-1.5">
      {typeof label === 'string' ? (
        <Label>{label}</Label>
      ) : (
        label
      )}
      <Input
        aria-invalid={Boolean(error)}
        className={className}
        {...rest}
      />
      {(error || descriptionText) && (
        <p className={`text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
          {error || descriptionText}
        </p>
      )}
    </div>
  );
};

export default InputWithLabel;
