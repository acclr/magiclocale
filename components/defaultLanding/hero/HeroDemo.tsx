import { useKeykit } from '@keykithq/sdk/react';
import { cn } from 'cn';
import { useMemo, useRef } from 'react';

import { heroDemoScript } from '@/content/landing/hero-demo';
import {
  buildHeroDemoRows,
  createHeroDemoTimeline,
  heroDemoLocales,
  isSameHeroDemoFrame,
  type HeroDemoFrame,
  type HeroDemoScript,
  type HeroDemoTiming,
} from '@/domain/landing/hero-demo';
import { useTimelineFrame } from '@/hooks/useTimelineFrame';

import AnimatedCodeEditor from './AnimatedCodeEditor';
import HeroTranslationEditor from './HeroTranslationEditor';

type HeroDemoProps = {
  script?: HeroDemoScript;
  timing?: HeroDemoTiming;
  projectName?: string;
};

const HeroDemo = ({
  script = heroDemoScript,
  timing,
  projectName = 'Acme Web',
}: HeroDemoProps) => {
  const { translate } = useKeykit();
  const containerRef = useRef<HTMLDivElement>(null);
  const timeline = useMemo(
    () => createHeroDemoTimeline(script, timing),
    [script, timing]
  );
  const frame = useTimelineFrame<HeroDemoFrame>(timeline, {
    isEqual: isSameHeroDemoFrame,
    viewportRef: containerRef,
  });
  const rows = useMemo(() => buildHeroDemoRows(script, frame), [script, frame]);
  const locales = useMemo(() => heroDemoLocales(script), [script]);
  const isSynced = frame.isRowVisible;

  const editorStatus =
    frame.phase === 'syncing' ? (
      <span className="text-primary">
        {translate('landing.hero.demo.code-syncing', 'Keykit · syncing keys…')}
      </span>
    ) : isSynced ? (
      <span className="text-emerald-300">
        ✓ {translate('landing.hero.demo.code-synced', 'Keykit · discovered')}{' '}
        {script.key}
      </span>
    ) : (
      translate('landing.hero.demo.code-watching', 'Keykit · watching')
    );

  return (
    <div className="relative isolate" ref={containerRef}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-[38rem] max-w-5xl rounded-full bg-[radial-gradient(closest-side,rgb(255_89_0/0.14),transparent)] blur-2xl"
      />

      <div className="relative mx-auto max-w-3xl">
        <AnimatedCodeEditor
          after={script.code.after}
          before={script.code.before}
          fileName={script.fileName}
          isDirty={frame.isFileDirty}
          isTyping={frame.phase === 'typing'}
          prefix={script.code.prefix}
          status={editorStatus}
          suffix={script.code.suffix}
          typed={script.code.typed.slice(0, frame.typedLength)}
        />
      </div>

      <div aria-hidden className="relative mx-auto h-16 w-px">
        <div
          className={cn(
            'absolute inset-0 bg-linear-to-b from-border to-border transition-colors duration-500',
            (frame.phase === 'syncing' || frame.phase === 'discovered') &&
              'via-primary'
          )}
        />
        {frame.phase === 'syncing' && (
          <span className="hero-packet absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/40 bg-background px-2.5 py-0.5 font-mono text-[11px] text-primary">
            {script.key}
          </span>
        )}
      </div>

      <HeroTranslationEditor
        highlightKeyId={script.key}
        locales={locales}
        phase={frame.phase}
        projectName={projectName}
        rows={rows}
        sourceLocale={script.sourceLocale}
      />
    </div>
  );
};

export default HeroDemo;
