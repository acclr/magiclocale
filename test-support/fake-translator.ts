import type {
  TranslateInput,
  Translator,
} from '../domain/translations/translator';

export class FakeTranslator implements Translator {
  readonly calls: TranslateInput[] = [];

  constructor(
    private readonly translateValue: (input: TranslateInput) => string = (
      input
    ) => `[${input.targetLocale}] ${input.text}`
  ) {}

  async translate(input: TranslateInput): Promise<string> {
    this.calls.push({ ...input });
    return this.translateValue(input);
  }
}
