export type ParsedSearch = {
  text: string;
  fields: Record<string, string>;
};

const TOKEN = /(\w+):(?:"([^"]*)"|(\S+))|"([^"]+)"|(\S+)/g;

export function parseSearchQuery(input: string): ParsedSearch {
  const fields: Record<string, string> = {};
  const rest: string[] = [];
  const source = input.trim();
  if (!source) {
    return { text: '', fields };
  }

  const pattern = new RegExp(TOKEN.source, 'g');
  let match: RegExpExecArray | null = pattern.exec(source);
  while (match) {
    const field = match[1];
    const quotedValue = match[2];
    const bareValue = match[3];
    const quotedText = match[4];
    const bareText = match[5];
    if (field) {
      fields[field.toLowerCase()] = (quotedValue ?? bareValue ?? '').trim();
    } else {
      rest.push(quotedText ?? bareText ?? '');
    }
    match = pattern.exec(source);
  }

  return { text: rest.join(' ').trim().toLocaleLowerCase(), fields };
}

export function fieldEquals(
  fields: Record<string, string>,
  name: string
): string | undefined {
  const value = fields[name];
  return value && value.length > 0 ? value : undefined;
}
