/** `{name}` or `{{name}}`. Matches the SDK interpolator. */
const VARIABLE_PATTERN =
  /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}|\{(?!\{)\s*([a-zA-Z_][\w]*)\s*\}/g;

export type TranslationVariable = {
  name: string;
  token: string;
};

export type TranslationTextPart =
  | { kind: 'text'; value: string }
  | { kind: 'variable'; name: string; token: string };

export function extractVariableTokens(text: string): TranslationVariable[] {
  const found: TranslationVariable[] = [];
  const seen: Record<string, true> = {};
  const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');
  let match: RegExpExecArray | null = pattern.exec(text);
  while (match) {
    const name = match[1] ?? match[2];
    if (!seen[name]) {
      seen[name] = true;
      found.push({ name, token: match[0] });
    }
    match = pattern.exec(text);
  }
  return found;
}

export function splitTranslationText(text: string): TranslationTextPart[] {
  const parts: TranslationTextPart[] = [];
  const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');
  let cursor = 0;
  let match: RegExpExecArray | null = pattern.exec(text);
  while (match) {
    if (match.index > cursor) {
      parts.push({ kind: 'text', value: text.slice(cursor, match.index) });
    }
    parts.push({
      kind: 'variable',
      name: match[1] ?? match[2],
      token: match[0],
    });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (cursor < text.length) {
    parts.push({ kind: 'text', value: text.slice(cursor) });
  }
  if (!parts.length) {
    parts.push({ kind: 'text', value: text });
  }
  return parts;
}

export function extractVariables(text: string): string[] {
  return extractVariableTokens(text)
    .map((variable) => variable.name)
    .sort();
}

export type VariableIssue = {
  kind: 'missing' | 'unexpected';
  name: string;
  token: string;
};

export function validateVariables(
  sourceText: string,
  translatedText: string
): VariableIssue[] {
  const source = extractVariableTokens(sourceText);
  const translated = extractVariableTokens(translatedText);
  const sourceNames = source.map((variable) => variable.name);
  const translatedNames = translated.map((variable) => variable.name);
  const issues: VariableIssue[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const variable = source[index];
    if (translatedNames.indexOf(variable.name) === -1) {
      issues.push({
        kind: 'missing',
        name: variable.name,
        token: variable.token,
      });
    }
  }
  for (let index = 0; index < translated.length; index += 1) {
    const variable = translated[index];
    if (sourceNames.indexOf(variable.name) === -1) {
      issues.push({
        kind: 'unexpected',
        name: variable.name,
        token: variable.token,
      });
    }
  }

  return issues;
}
