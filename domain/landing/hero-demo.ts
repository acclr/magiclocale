import type {
  DashboardCell,
  DashboardRow,
  TranslationSource,
} from '../translations';

export type HeroDemoEntry = {
  value: string;
  source: TranslationSource;
};

export type HeroDemoKeySpec = {
  key: string;
  values: Record<string, HeroDemoEntry>;
};

export type HeroDemoScript = {
  fileName: string;
  code: {
    before: string[];
    prefix: string;
    typed: string;
    suffix: string;
    after: string[];
  };
  key: string;
  sourceLocale: string;
  sourceText: string;
  /** Target locale -> AI output, in the order the columns stream. */
  translations: Record<string, string>;
  existingKeys: HeroDemoKeySpec[];
};

export type HeroDemoTiming = {
  startDelay: number;
  typeInterval: number;
  saveDelay: number;
  discoverDelay: number;
  translateDelay: number;
  localeStagger: number;
  streamInterval: number;
  hold: number;
};

export type HeroDemoPhase =
  | 'idle'
  | 'typing'
  | 'syncing'
  | 'discovered'
  | 'translating'
  | 'translated';

export type HeroDemoFrame = {
  phase: HeroDemoPhase;
  typedLength: number;
  isFileDirty: boolean;
  isRowVisible: boolean;
  /** Target locale -> number of streamed characters. */
  streamed: Record<string, number>;
};

export type HeroDemoTimeline = {
  duration: number;
  frameAt: (elapsed: number) => HeroDemoFrame;
};

export const DEFAULT_HERO_DEMO_TIMING: HeroDemoTiming = {
  startDelay: 900,
  typeInterval: 55,
  saveDelay: 650,
  discoverDelay: 900,
  translateDelay: 1100,
  localeStagger: 450,
  streamInterval: 38,
  hold: 4200,
};

const PAUSE_AFTER = new Set([',', '(', '{']);

/** Deterministic human-ish rhythm so server and client render the same frame. */
function keystrokeOffsets(text: string, interval: number): number[] {
  const offsets: number[] = [];
  let total = 0;
  for (let index = 0; index < text.length; index += 1) {
    const jitter = 0.6 + ((index * 7919) % 9) / 10;
    const pause = PAUSE_AFTER.has(text[index - 1] ?? '') ? 2.6 : 1;
    total += Math.round(interval * jitter * pause);
    offsets.push(total);
  }
  return offsets;
}

export function heroDemoLocales(script: HeroDemoScript): string[] {
  return [script.sourceLocale, ...Object.keys(script.translations)];
}

export function createHeroDemoTimeline(
  script: HeroDemoScript,
  timing: HeroDemoTiming = DEFAULT_HERO_DEMO_TIMING
): HeroDemoTimeline {
  const offsets = keystrokeOffsets(script.code.typed, timing.typeInterval);
  const targets = Object.entries(script.translations);
  const typeStart = timing.startDelay;
  const typeEnd = typeStart + (offsets[offsets.length - 1] ?? 0);
  const syncAt = typeEnd + timing.saveDelay;
  const discoverAt = syncAt + timing.discoverDelay;
  const translateAt = discoverAt + timing.translateDelay;
  const streamStarts = targets.map(
    (_, index) => translateAt + index * timing.localeStagger
  );
  const translateEnd = Math.max(
    translateAt,
    ...targets.map(
      ([, text], index) =>
        streamStarts[index] + text.length * timing.streamInterval
    )
  );
  const duration = translateEnd + timing.hold;

  const frameAt = (elapsed: number): HeroDemoFrame => {
    const typingElapsed = elapsed - typeStart;
    let typedLength = 0;
    while (
      typedLength < offsets.length &&
      offsets[typedLength] <= typingElapsed
    ) {
      typedLength += 1;
    }

    const streamed: Record<string, number> = {};
    targets.forEach(([locale, text], index) => {
      const chars = Math.floor(
        (elapsed - streamStarts[index]) / timing.streamInterval
      );
      streamed[locale] = Math.min(text.length, Math.max(0, chars));
    });

    const phase: HeroDemoPhase =
      elapsed < typeStart
        ? 'idle'
        : elapsed < syncAt
          ? 'typing'
          : elapsed < discoverAt
            ? 'syncing'
            : elapsed < translateAt
              ? 'discovered'
              : elapsed < translateEnd
                ? 'translating'
                : 'translated';

    return {
      phase,
      typedLength,
      isFileDirty: typedLength > 0 && elapsed < syncAt,
      isRowVisible: elapsed >= discoverAt,
      streamed,
    };
  };

  return { duration, frameAt };
}

export function isSameHeroDemoFrame(
  a: HeroDemoFrame,
  b: HeroDemoFrame
): boolean {
  if (
    a.phase !== b.phase ||
    a.typedLength !== b.typedLength ||
    a.isFileDirty !== b.isFileDirty ||
    a.isRowVisible !== b.isRowVisible
  ) {
    return false;
  }
  const locales = Object.keys(a.streamed);
  return (
    locales.length === Object.keys(b.streamed).length &&
    locales.every((locale) => a.streamed[locale] === b.streamed[locale])
  );
}

function toCell(
  key: string,
  locale: string,
  entry: HeroDemoEntry | undefined
): DashboardCell {
  if (!entry?.value) {
    return {
      translationId: null,
      locale,
      value: null,
      source: null,
      status: 'missing',
      aiLocked: false,
      missing: true,
      updatedAt: null,
    };
  }
  return {
    translationId: `${key}:${locale}`,
    locale,
    value: entry.value,
    source: entry.source,
    status: entry.source === 'code' ? 'source' : entry.source,
    aiLocked: false,
    missing: false,
    updatedAt: null,
  };
}

export function toHeroDemoRow(
  spec: HeroDemoKeySpec,
  locales: string[],
  sourceLocale: string
): DashboardRow {
  const cells = Object.fromEntries(
    locales.map((locale) => [
      locale,
      toCell(spec.key, locale, spec.values[locale]),
    ])
  );
  const sourceText = spec.values[sourceLocale]?.value ?? '';
  return {
    keyId: spec.key,
    key: spec.key,
    sourceText,
    searchText: `${spec.key} ${sourceText}`.toLocaleLowerCase(),
    namespace: spec.key.split('.')[0] ?? null,
    owner: null,
    usageCount: 1,
    usageFiles: [],
    lifecycle: 'active',
    cells,
    statuses: Array.from(
      new Set(Object.values(cells).map((cell) => cell.status))
    ),
    missingLocales: locales.filter((locale) => cells[locale].missing),
  };
}

export function buildHeroDemoRows(
  script: HeroDemoScript,
  frame: HeroDemoFrame
): DashboardRow[] {
  const locales = heroDemoLocales(script);
  const existing = script.existingKeys.map((spec) =>
    toHeroDemoRow(spec, locales, script.sourceLocale)
  );
  if (!frame.isRowVisible) {
    return existing;
  }

  const values: Record<string, HeroDemoEntry> = {
    [script.sourceLocale]: { value: script.sourceText, source: 'code' },
  };
  Object.entries(script.translations).forEach(([locale, text]) => {
    values[locale] = {
      value: text.slice(0, frame.streamed[locale] ?? 0),
      source: 'ai',
    };
  });

  return [
    toHeroDemoRow({ key: script.key, values }, locales, script.sourceLocale),
    ...existing,
  ];
}
