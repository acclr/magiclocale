import OpenAI from 'openai';

import type {
  TranslateInput,
  Translator,
} from '../../domain/translations/translator';

export type OpenAITranslatorConfig = {
  apiKey: string;
  model: string;
  baseURL?: string;
};

export type OpenAIClient = Pick<OpenAI, 'chat'>;

type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

type ChatCompletionResponse = {
  choices: Array<{ message?: { content?: string | null } }>;
};

const SYSTEM_PROMPT = [
  'You are a professional software localization translator.',
  'Translate the user-provided text into the requested target locale.',
  'Preserve placeholders, interpolation syntax, markup, and product names.',
  'Return only the translated text, without quotes or commentary.',
].join(' ');

export class OpenAITranslator implements Translator {
  private readonly client: OpenAIClient;
  private omitTemperature = false;

  constructor(
    private readonly config: OpenAITranslatorConfig,
    client?: OpenAIClient
  ) {
    this.requireConfig(config.apiKey, 'OpenAI API key');
    this.requireConfig(config.model, 'OpenAI model');
    this.client =
      client ??
      new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });
  }

  async translate(input: TranslateInput): Promise<string> {
    const completion = await this.createCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          `Translation key: ${input.key}`,
          `Source locale: ${input.sourceLocale}`,
          `Target locale: ${input.targetLocale}`,
          'Text:',
          input.text,
        ].join('\n'),
      },
    ]);
    const value = completion.choices[0]?.message?.content?.trim();

    if (!value) {
      throw new Error('OpenAI returned an empty translation');
    }

    return value;
  }

  private async createCompletion(
    messages: ChatMessage[]
  ): Promise<ChatCompletionResponse> {
    const request = {
      model: this.config.model,
      messages,
      stream: false as const,
    };

    if (!this.omitTemperature) {
      try {
        return await this.client.chat.completions.create({
          ...request,
          temperature: 0,
        });
      } catch (error) {
        if (!isUnsupportedTemperatureError(error)) {
          throw error;
        }
        this.omitTemperature = true;
      }
    }

    return this.client.chat.completions.create(request);
  }

  private requireConfig(value: string, label: string): void {
    if (!value.trim()) {
      throw new Error(`${label} is required`);
    }
  }
}

export function isUnsupportedTemperatureError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    param?: string | null;
    message?: string;
  };

  if (candidate.param === 'temperature') {
    return true;
  }

  const message = candidate.message ?? '';
  return (
    message.includes("'temperature'") && /does not support/i.test(message)
  );
}
