/** `{name}` or `{{name}}`. The same pattern is used by the dashboard and the CLI. */
export const TRANSLATION_VARIABLE_PATTERN =
  /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}|\{(?!\{)\s*([a-zA-Z_][\w]*)\s*\}/g;

export type TranslationVariable = {
  name: string;
  token: string;
};

export function translationVariables(text: string): TranslationVariable[] {
  const found: TranslationVariable[] = [];
  const seen = new Set<string>();
  const pattern = new RegExp(TRANSLATION_VARIABLE_PATTERN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const name = match[1] ?? match[2];
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);
    found.push({ name, token: match[0] });
  }
  return found;
}
