import {
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  type ReactNode,
} from 'react';
import { TRANSLATION_VARIABLE_PATTERN } from './placeholders';

export type TranslationValues = Record<string, ReactNode>;

/**
 * Replaces `{name}` and `{{name}}` slots.
 * String and number values stay a string. Any other value, including JSX, is
 * rendered in place and the result is a list of nodes.
 */
export function interpolate(
  template: string,
  values?: TranslationValues
): ReactNode {
  if (!values) {
    return template;
  }

  const parts: ReactNode[] = [];
  const pattern = new RegExp(TRANSLATION_VARIABLE_PATTERN.source, 'g');
  let cursor = 0;
  let rich = false;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(template)) !== null) {
    if (match.index > cursor) {
      parts.push(template.slice(cursor, match.index));
    }
    const name = match[1] ?? match[2];
    const value = values[name];
    if (value === undefined) {
      parts.push(match[0]);
    } else if (typeof value === 'string' || typeof value === 'number') {
      parts.push(String(value));
    } else if (isValidElement(value)) {
      rich = true;
      parts.push(cloneElement(value, { key: `${name}:${match.index}` }));
    } else {
      rich = true;
      parts.push(
        createElement(Fragment, { key: `${name}:${match.index}` }, value)
      );
    }
    cursor = match.index + match[0].length;
  }

  if (cursor === 0) {
    return template;
  }
  if (cursor < template.length) {
    parts.push(template.slice(cursor));
  }
  if (!rich) {
    return parts.join('');
  }
  return parts;
}
