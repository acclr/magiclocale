import { tokenizeJsx } from '../../../lib/landing/highlight-jsx';

describe('tokenizeJsx', () => {
  it('round-trips the original text', () => {
    const line =
      '      <button type="submit">{t("common.actions.login", "Login button text")}</button>';

    expect(
      tokenizeJsx(line)
        .map((token) => token.text)
        .join('')
    ).toBe(line);
  });

  it('classifies tags, attributes, calls and strings', () => {
    const tokens = tokenizeJsx('<button type="submit">{t("a.b")}</button>');
    const kinds = Object.fromEntries(
      tokens.map((token) => [token.text, token.kind])
    );

    expect(kinds.button).toBe('tag');
    expect(kinds.type).toBe('attribute');
    expect(kinds['"submit"']).toBe('string');
    expect(kinds.t).toBe('call');
    expect(kinds['"a.b"']).toBe('string');
  });

  it('highlights a half-typed string as a string', () => {
    const tokens = tokenizeJsx('{t("common.act');

    expect(tokens[tokens.length - 1]).toEqual({
      kind: 'string',
      text: '"common.act',
    });
  });

  it('recognises keywords', () => {
    expect(tokenizeJsx('export function Login()')[0]).toEqual({
      kind: 'keyword',
      text: 'export',
    });
  });
});
