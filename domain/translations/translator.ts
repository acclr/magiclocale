export type TranslateInput = {
  key: string;
  text: string;
  sourceLocale: string;
  targetLocale: string;
};

export class TranslatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslatorError';
  }
}

export interface Translator {
  translate(input: TranslateInput): Promise<string>;
}
