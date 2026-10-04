import {
  buildHeroDemoRows,
  createHeroDemoTimeline,
  isSameHeroDemoFrame,
  type HeroDemoScript,
  type HeroDemoTiming,
} from '../../../domain/landing/hero-demo';

const script: HeroDemoScript = {
  fileName: 'Login.tsx',
  code: { before: [], prefix: '<b>', typed: 'abc', suffix: '</b>', after: [] },
  key: 'common.actions.login',
  sourceLocale: 'en',
  sourceText: 'Log in',
  translations: { sv: 'Logga in', de: 'Anmelden' },
  existingKeys: [
    {
      key: 'common.actions.logout',
      values: {
        en: { value: 'Log out', source: 'code' },
        sv: { value: 'Logga ut', source: 'ai' },
        de: { value: 'Abmelden', source: 'manual' },
      },
    },
  ],
};

const timing: HeroDemoTiming = {
  startDelay: 100,
  typeInterval: 10,
  saveDelay: 100,
  discoverDelay: 100,
  translateDelay: 100,
  localeStagger: 50,
  streamInterval: 10,
  hold: 1000,
};

describe('createHeroDemoTimeline', () => {
  const timeline = createHeroDemoTimeline(script, timing);

  it('starts idle with nothing typed or discovered', () => {
    const frame = timeline.frameAt(0);

    expect(frame.phase).toBe('idle');
    expect(frame.typedLength).toBe(0);
    expect(frame.isRowVisible).toBe(false);
    expect(frame.streamed).toEqual({ sv: 0, de: 0 });
  });

  it('walks through every phase in order and ends fully translated', () => {
    const phases: string[] = [];
    for (let ms = 0; ms <= timeline.duration; ms += 5) {
      const { phase } = timeline.frameAt(ms);
      if (phases[phases.length - 1] !== phase) {
        phases.push(phase);
      }
    }

    expect(phases).toEqual([
      'idle',
      'typing',
      'syncing',
      'discovered',
      'translating',
      'translated',
    ]);
    expect(timeline.frameAt(timeline.duration)).toMatchObject({
      typedLength: 3,
      isFileDirty: false,
      isRowVisible: true,
      streamed: { sv: 8, de: 8 },
    });
  });

  it('types monotonically and marks the file dirty until it syncs', () => {
    let previous = 0;
    for (let ms = 0; ms <= timeline.duration; ms += 5) {
      const frame = timeline.frameAt(ms);
      expect(frame.typedLength).toBeGreaterThanOrEqual(previous);
      if (frame.phase === 'typing' && frame.typedLength > 0) {
        expect(frame.isFileDirty).toBe(true);
      }
      if (frame.phase === 'syncing') {
        expect(frame.isFileDirty).toBe(false);
      }
      previous = frame.typedLength;
    }
  });

  it('staggers locales so later columns start streaming later', () => {
    const translating = Array.from({ length: timeline.duration }, (_, ms) =>
      timeline.frameAt(ms)
    ).find((frame) => frame.streamed.sv > 0 && frame.streamed.de === 0);

    expect(translating).toBeDefined();
  });
});

describe('buildHeroDemoRows', () => {
  const timeline = createHeroDemoTimeline(script, timing);

  it('only shows existing keys before discovery', () => {
    const rows = buildHeroDemoRows(script, timeline.frameAt(0));

    expect(rows.map((row) => row.key)).toEqual(['common.actions.logout']);
    expect(rows[0].cells.de).toMatchObject({
      status: 'manual',
      missing: false,
    });
  });

  it('inserts the discovered key on top with missing targets', () => {
    const frame = { ...timeline.frameAt(0), isRowVisible: true };
    const [row] = buildHeroDemoRows(script, frame);

    expect(row.key).toBe('common.actions.login');
    expect(row.cells.en).toMatchObject({
      value: 'Log in',
      status: 'source',
    });
    expect(row.cells.sv.missing).toBe(true);
    expect(row.missingLocales).toEqual(['sv', 'de']);
  });

  it('reflects streamed AI output as partial ai cells', () => {
    const frame = {
      ...timeline.frameAt(0),
      isRowVisible: true,
      streamed: { sv: 5, de: 0 },
    };
    const [row] = buildHeroDemoRows(script, frame);

    expect(row.cells.sv).toMatchObject({ value: 'Logga', status: 'ai' });
    expect(row.missingLocales).toEqual(['de']);
  });
});

describe('isSameHeroDemoFrame', () => {
  it('compares streamed progress per locale', () => {
    const timeline = createHeroDemoTimeline(script, timing);
    const frame = timeline.frameAt(0);

    expect(isSameHeroDemoFrame(frame, { ...frame })).toBe(true);
    expect(
      isSameHeroDemoFrame(frame, {
        ...frame,
        streamed: { ...frame.streamed, de: 1 },
      })
    ).toBe(false);
  });
});
