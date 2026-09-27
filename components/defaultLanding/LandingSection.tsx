import { cn } from 'cn';
import type { ReactNode } from 'react';

import Reveal from './Reveal';

type LandingSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  revealClassName?: string;
};

const LandingSection = ({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  revealClassName,
  contentClassName,
}: LandingSectionProps) => {
  return (
    <section
      id={id}
      className={cn(
        'mx-auto max-w-6xl scroll-mt-28 px-6 py-24 sm:py-28',
        className
      )}
    >
      <Reveal className={revealClassName}>
        {eyebrow ? (
          <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </Reveal>
      <div className={cn('mt-12', contentClassName)}>{children}</div>
    </section>
  );
};

export default LandingSection;
