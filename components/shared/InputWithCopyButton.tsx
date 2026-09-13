import type { ComponentProps } from 'react';

import { CopyToClipboardButton } from '@/components/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputWithCopyButtonProps extends ComponentProps<typeof Input> {
  label: string;
  description?: string;
}

const InputWithCopyButton = (props: InputWithCopyButtonProps) => {
  const { label, value, description, ...rest } = props;
  const id = label.replace(/ /g, '');

  return (
    <div className="grid w-full gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <CopyToClipboardButton value={value?.toString() || ''} />
      </div>
      <Input id={id} {...rest} value={value} />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export default InputWithCopyButton;
