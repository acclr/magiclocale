import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const CheckboxComponent = ({
  onChange,
  name,
  value,
  label,
  defaultChecked,
  className,
}: {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
  className?: string;
}) => {
  return (
    <div className={`flex items-center ${className || ''}`} key={value}>
      <Label className="flex items-center gap-2 text-sm">
        <Checkbox
          name={name}
          value={value}
          defaultChecked={Boolean(defaultChecked)}
          onCheckedChange={(checked) => {
            onChange({
              target: { name, value, checked: Boolean(checked) },
            } as React.ChangeEvent<HTMLInputElement>);
          }}
        />
        <span className="text-foreground">{label}</span>
      </Label>
    </div>
  );
};

export default CheckboxComponent;
