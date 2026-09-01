/** @jest-environment node */

import {
  OpenAITranslator,
  type OpenAIClient,
} from '../../../data/translations/openai-translator';

function setup(content: string | null = ' Spara ändringar ') {
  const create = jest.fn().mockResolvedValue({
    choices: [{ message: { content } }],
  });
  const client = {
    chat: { completions: { create } },
  } as unknown as OpenAIClient;
  const translator = new OpenAITranslator(
    {
      apiKey: 'test-api-key',
      model: 'test-model',
      baseURL: 'https://llm.example.test/v1',
    },
    client
  );

  return { create, translator };
}

describe('OpenAITranslator', () => {
  it('sends a deterministic localization request and returns trimmed text', async () => {
    const { create, translator } = setup();

    await expect(
      translator.translate({
        key: 'settings.save',
        text: 'Save {count} changes',
        sourceLocale: 'en',
        targetLocale: 'sv-SE',
      })
    ).resolves.toBe('Spara ändringar');

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      model: 'test-model',
      temperature: 0,
      stream: false,
      messages: [
        {
          role: 'system',
          content: expect.stringContaining('Preserve placeholders'),
        },
        {
          role: 'user',
          content: [
            'Translation key: settings.save',
            'Source locale: en',
            'Target locale: sv-SE',
            'Text:',
            'Save {count} changes',
          ].join('\n'),
        },
      ],
    });
  });

  it.each([null, '', '   '])(
    'rejects an empty provider response',
    async (content) => {
      const { translator } = setup(content);

      await expect(
        translator.translate({
          key: 'nav.home',
          text: 'Home',
          sourceLocale: 'en',
          targetLocale: 'de',
        })
      ).rejects.toThrow('OpenAI returned an empty translation');
    }
  );

  it('retries without temperature when the model rejects temperature 0', async () => {
    const { create, translator } = setup();
    const unsupported = Object.assign(
      new Error(
        "Unsupported value: 'temperature' does not support 0 with this model. Only the default (1) value is supported."
      ),
      { status: 400, param: 'temperature', code: 'unsupported_value' }
    );
    const success = {
      choices: [{ message: { content: 'Accueil' } }],
    };
    create
      .mockRejectedValueOnce(unsupported)
      .mockResolvedValueOnce(success)
      .mockResolvedValueOnce(success);

    await expect(
      translator.translate({
        key: 'nav.home',
        text: 'Home',
        sourceLocale: 'en',
        targetLocale: 'fr',
      })
    ).resolves.toBe('Accueil');
    await expect(
      translator.translate({
        key: 'nav.about',
        text: 'About',
        sourceLocale: 'en',
        targetLocale: 'fr',
      })
    ).resolves.toBe('Accueil');

    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ temperature: 0 })
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({ temperature: expect.anything() })
    );
    expect(create).toHaveBeenNthCalledWith(
      3,
      expect.not.objectContaining({ temperature: expect.anything() })
    );
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('validates required provider configuration when constructed', () => {
    const client = {
      chat: { completions: { create: jest.fn() } },
    } as unknown as OpenAIClient;

    expect(
      () => new OpenAITranslator({ apiKey: ' ', model: 'test-model' }, client)
    ).toThrow('OpenAI API key is required');
    expect(
      () => new OpenAITranslator({ apiKey: 'test-key', model: ' ' }, client)
    ).toThrow('OpenAI model is required');
  });
});
