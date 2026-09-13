import type { ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalProps {
  open: boolean;
  close: () => void;
  children: ReactNode;
}

interface BodyProps {
  children: ReactNode;
  className?: string;
}

const Modal = ({ open, close, children }: ModalProps) => {
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        }
      }}
    >
      <DialogContent>
        <span className="sr-only">{t('x')}</span>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};

const Header = ({ children }: { children: ReactNode }) => {
  return (
    <DialogHeader>
      <DialogTitle>{children}</DialogTitle>
    </DialogHeader>
  );
};

const Description = ({ children }: { children: ReactNode }) => {
  return <DialogDescription>{children}</DialogDescription>;
};

const Body = ({ children, className }: BodyProps) => {
  return <div className={`py-3 ${className ?? ''}`}>{children}</div>;
};

const Footer = ({ children }: { children: ReactNode }) => {
  return (
    <DialogFooter className="flex justify-end gap-2">{children}</DialogFooter>
  );
};

Modal.Header = Header;
Modal.Description = Description;
Modal.Body = Body;
Modal.Footer = Footer;

export default Modal;
