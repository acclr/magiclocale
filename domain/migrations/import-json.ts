export type ImportedTranslation = {
  key: string;
  sourceText: string;
};

function flatten(
  value: unknown,
  prefix: string,
  out: ImportedTranslation[]
): void {
  if (typeof value === 'string') {
    if (prefix) {
      out.push({ key: prefix, sourceText: value });
    }
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return;
  }
  for (const [name, nested] of Object.entries(value)) {
    flatten(nested, prefix ? `${prefix}.${name}` : name, out);
  }
}

export function flattenTranslationJson(
  input: unknown
): ImportedTranslation[] {
  const out: ImportedTranslation[] = [];
  flatten(input, '', out);
  return out;
}
