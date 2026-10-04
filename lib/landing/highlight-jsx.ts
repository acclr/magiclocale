export type JsxTokenKind =
  | 'keyword'
  | 'string'
  | 'tag'
  | 'attribute'
  | 'call'
  | 'punctuation'
  | 'plain';

export type JsxToken = {
  kind: JsxTokenKind;
  text: string;
};

const KEYWORDS = new Set([
  'import',
  'from',
  'export',
  'function',
  'const',
  'return',
]);

// Groups: 1 string, 2 tag opener, 3 tag name, 4 word, 5 punctuation.
// Unterminated strings are matched too, so half-typed code still highlights.
const TOKEN_PATTERN =
  /("[^"]*"?|'[^']*'?)|(<\/?)([A-Za-z][\w.]*)?|([A-Za-z_$][\w$-]*)|([{}()[\];,.=/>:])|\s+|./g;

export function tokenizeJsx(line: string): JsxToken[] {
  const tokens: JsxToken[] = [];
  const push = (kind: JsxTokenKind, text: string) => {
    const previous = tokens[tokens.length - 1];
    if (previous?.kind === kind) {
      previous.text += text;
    } else {
      tokens.push({ kind, text });
    }
  };

  TOKEN_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_PATTERN.exec(line)) && match[0]) {
    const [, string, open, tag, word, punct] = match;
    if (string) {
      push('string', string);
    } else if (open) {
      push('punctuation', open);
      if (tag) {
        push('tag', tag);
      }
    } else if (word) {
      const next = line.charAt(TOKEN_PATTERN.lastIndex);
      push(
        KEYWORDS.has(word)
          ? 'keyword'
          : next === '('
            ? 'call'
            : next === '='
              ? 'attribute'
              : 'plain',
        word
      );
    } else if (punct) {
      push('punctuation', punct);
    } else {
      push('plain', match[0]);
    }
  }
  return tokens;
}
