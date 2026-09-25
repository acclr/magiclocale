import {
  MAX_KEYS_PER_BATCH,
  parseSourceKeyPayload,
} from '../../lib/translations/source-key-payload';

describe('parseSourceKeyPayload', () => {
  it('validates and deduplicates source keys with the last value winning', () => {
    expect(
      parseSourceKeyPayload({
        keys: [
          { key: ' demo.title ', sourceText: 'Old title' },
          { key: 'demo.title', sourceText: 'New title' },
          { key: 'demo.cta', sourceText: 'Get started' },
        ],
      })
    ).toEqual({
      success: true,
      keys: [
        {
          key: 'demo.title',
          sourceText: 'New title',
          type: 'translation',
          usage: null,
        },
        {
          key: 'demo.cta',
          sourceText: 'Get started',
          type: 'translation',
          usage: null,
        },
      ],
    });
  });

  it.each([
    undefined,
    {},
    { keys: [] },
    { keys: [{ key: '', sourceText: 'Text' }] },
    { keys: [{ key: 'demo.title', sourceText: '' }] },
    { keys: [{ key: 'x'.repeat(201), sourceText: 'Text' }] },
    { keys: [{ key: 'demo.title', sourceText: 'x'.repeat(10_001) }] },
  ])('rejects malformed payload %#', (input) => {
    expect(parseSourceKeyPayload(input).success).toBe(false);
  });

  it('rejects batches larger than the public API limit', () => {
    const keys = Array.from({ length: MAX_KEYS_PER_BATCH + 1 }, (_, index) => ({
      key: `key.${index}`,
      sourceText: `Text ${index}`,
    }));

    expect(parseSourceKeyPayload({ keys })).toEqual({
      success: false,
      error: `A batch may contain at most ${MAX_KEYS_PER_BATCH} keys.`,
    });
  });
});
