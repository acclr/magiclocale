import { useEffect, useRef, useState, type RefObject } from 'react';

export type Timeline<Frame> = {
  duration: number;
  frameAt: (elapsed: number) => Frame;
};

type UseTimelineFrameOptions<Frame> = {
  isEqual: (a: Frame, b: Frame) => boolean;
  /** Playback pauses while this element is off-screen. */
  viewportRef?: RefObject<Element | null>;
};

export function useTimelineFrame<Frame>(
  timeline: Timeline<Frame>,
  { isEqual, viewportRef }: UseTimelineFrameOptions<Frame>
): Frame {
  const [frame, setFrame] = useState(() => timeline.frameAt(0));
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  useEffect(() => {
    const commit = (next: Frame) =>
      setFrame((current) =>
        isEqualRef.current(current, next) ? current : next
      );

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit(timeline.frameAt(timeline.duration));
      return;
    }

    let elapsed = 0;
    let last: number | null = null;
    let inView = true;
    let raf = 0;

    const tick = (now: number) => {
      if (last !== null && inView && !document.hidden) {
        elapsed = (elapsed + Math.min(now - last, 100)) % timeline.duration;
        commit(timeline.frameAt(elapsed));
      }
      last = now;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    const target = viewportRef?.current;
    const observer = target
      ? new IntersectionObserver(([entry]) => {
          inView = entry?.isIntersecting ?? true;
        })
      : null;
    if (target) {
      observer?.observe(target);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [timeline, viewportRef]);

  return frame;
}
