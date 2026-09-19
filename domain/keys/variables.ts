const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g;

export function extractVariables(text: string): string[] {
  const names: string[] = [];
  const seen: Record<string, true> = {};
  const pattern = new RegExp(VARIABLE_PATTERN.source, 'g');
  let match: RegExpExecArray | null = pattern.exec(text);
  while (match) {
    const name = match[1];
    if (!seen[name]) {
      seen[name] = true;
      names.push(name);
    }
    match = pattern.exec(text);
  }
  return names.sort();
}

export type VariableIssue = {
  kind: 'missing' | 'unexpected';
  name: string;
};

export function validateVariables(
  sourceText: string,
  translatedText: string
): VariableIssue[] {
  const source = extractVariables(sourceText);
  const translated = extractVariables(translatedText);
  const issues: VariableIssue[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const name = source[index];
    if (translated.indexOf(name) === -1) {
      issues.push({ kind: 'missing', name });
    }
  }
  for (let index = 0; index < translated.length; index += 1) {
    const name = translated[index];
    if (source.indexOf(name) === -1) {
      issues.push({ kind: 'unexpected', name });
    }
  }

  return issues;
}
