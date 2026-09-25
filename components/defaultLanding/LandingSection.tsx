import { cn } from 'cn';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';

type LandingSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

const LandingSection = ({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  contentClassName,
}: LandingSectionProps) => {
  return (
    <section id={id} className={cn('scroll-mt-24 py-16 sm:py-24', className)}>
      <div className={cn('mx-auto max-w-6xl px-4 sm:px-6', contentClassName)}>
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {eyebrow ? (
            <Badge variant="outline" className="mb-4">
              {eyebrow}
            </Badge>
          ) : null}
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
};

export default LandingSection;
