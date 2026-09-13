import * as React from 'react';

import {
  Alert as AlertUi,
  AlertDescription,
} from '@/components/ui/alert';

type AlertStatus = 'info' | 'success' | 'warning' | 'error';

type AlertProps = React.ComponentProps<typeof AlertUi> & {
  status?: AlertStatus | null;
};

const Alert = ({ children, className, status, ...rest }: AlertProps) => {
  return (
    <AlertUi
      {...rest}
      variant={status === 'error' ? 'destructive' : 'default'}
      className={className}
    >
      <AlertDescription>{children}</AlertDescription>
    </AlertUi>
  );
};

export default Alert;
