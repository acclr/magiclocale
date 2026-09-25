import type {
  FlagEvaluation,
  FlagEvaluationContext,
  FlagRuleOperator,
  FlagRuleSnapshot,
  FlagSnapshot,
  FlagType,
  FlagValue,
} from './types';

/**
 * Deterministic 0-100 bucket for percentage rollouts.
 *
 * SHA-1 of `salt:flagKey:userKey`, then the first 32 bits mapped onto
 * [0, 100). Implemented here so Node and the browser produce the same
 * number without depending on Web Crypto (which is async).
 */
export function bucketOf(seed: string): number {
  const digest = sha1Bytes(utf8Bytes(seed));
  const n =
    ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>>
    0;
  return (n / 0x100000000) * 100;
}

function utf8Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    let code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        index += 1;
      }
    }
    if (code <= 0x7f) {
      bytes.push(code);
    } else if (code <= 0x7ff) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code <= 0xffff) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return Uint8Array.from(bytes);
}

function sha1Bytes(message: Uint8Array): Uint8Array {
  const bitLength = message.length * 8;
  const paddedLength = (((message.length + 9 + 63) >> 6) << 6) >>> 0;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const words = new Uint32Array(80);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let t = 0; t < 16; t += 1) {
      words[t] = view.getUint32(offset + t * 4);
    }
    for (let t = 16; t < 80; t += 1) {
      const mixed = words[t - 3] ^ words[t - 8] ^ words[t - 14] ^ words[t - 16];
      words[t] = ((mixed << 1) | (mixed >>> 31)) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let t = 0; t < 80; t += 1) {
      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + words[t]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const digest = new Uint8Array(20);
  const digestView = new DataView(digest.buffer);
  digestView.setUint32(0, h0);
  digestView.setUint32(4, h1);
  digestView.setUint32(8, h2);
  digestView.setUint32(12, h3);
  digestView.setUint32(16, h4);
  return digest;
}

function isIncludedInRollout(
  percentage: number,
  salt: string,
  flagKey: string,
  contextKey: string
): boolean {
  if (percentage <= 0) {
    return false;
  }
  if (percentage >= 100) {
    return true;
  }
  return bucketOf(`${salt}:${flagKey}:${contextKey}`) < percentage;
}

function attributeValue(
  context: FlagEvaluationContext,
  attribute: string
): string | number | boolean | null | undefined {
  if (attribute === 'key') {
    return context.key ?? undefined;
  }
  return context.attributes?.[attribute];
}

export function matchesOperator(
  operator: FlagRuleOperator,
  actual: string | number | boolean,
  values: string[]
): boolean {
  const text = String(actual);
  const first = values[0] ?? '';

  switch (operator) {
    case 'equals':
      return text === first;
    case 'not-equals':
      return text !== first;
    case 'in':
      return values.includes(text);
    case 'not-in':
      return !values.includes(text);
    case 'contains':
      return text.includes(first);
    case 'not-contains':
      return !text.includes(first);
    case 'starts-with':
      return text.startsWith(first);
    case 'ends-with':
      return text.endsWith(first);
    case 'greater-than':
    case 'less-than': {
      const left = Number(actual);
      const right = Number(first);
      if (Number.isNaN(left) || Number.isNaN(right)) {
        return false;
      }
      return operator === 'greater-than' ? left > right : left < right;
    }
  }
}

/**
 * A rule only matches when the attribute is actually present. A missing
 * attribute never matches, including for negated operators, so an incomplete
 * context cannot accidentally satisfy a `not-equals` rule.
 */
export function ruleMatches(
  rule: FlagRuleSnapshot,
  context: FlagEvaluationContext
): boolean {
  const actual = attributeValue(context, rule.attribute);
  if (actual === undefined || actual === null || actual === '') {
    return false;
  }
  return matchesOperator(rule.operator, actual, rule.values);
}

export function coerceToType(value: FlagValue, type: FlagType): FlagValue {
  switch (type) {
    case 'boolean':
      return typeof value === 'boolean' ? value : Boolean(value);
    case 'string':
      if (typeof value === 'string') {
        return value;
      }
      return value === null || value === undefined ? '' : String(value);
    case 'number': {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    case 'json':
      return value ?? null;
  }
}

/**
 * Pure flag evaluation, shared verbatim by the server endpoint and the SDK so
 * the two can never disagree about what a user should see.
 *
 * Order of precedence:
 *   1. flag absent            -> caller fallback
 *   2. flag disabled          -> offValue
 *   3. first matching rule    -> rule value, gated by the rule's own rollout
 *   4. flag-level rollout     -> defaultValue when bucketed in, else offValue
 *   5. otherwise              -> defaultValue
 *
 * Percentage rollouts bucket on `context.key`. Without one every caller lands
 * in the same bucket, so a rollout degrades to all-or-nothing.
 */
export function evaluateFlag(
  flag: FlagSnapshot | null | undefined,
  context: FlagEvaluationContext = {},
  fallback: FlagValue = null
): FlagEvaluation {
  if (!flag) {
    return {
      key: '',
      value: fallback,
      reason: 'flag-not-found',
      ruleIndex: null,
    };
  }

  const result = (
    value: FlagValue,
    reason: FlagEvaluation['reason'],
    ruleIndex: number | null = null
  ): FlagEvaluation => ({
    key: flag.key,
    value: coerceToType(value, flag.type),
    reason,
    ruleIndex,
  });

  if (!flag.enabled) {
    return result(flag.offValue, 'disabled');
  }

  const contextKey = context.key ?? '';

  for (let index = 0; index < flag.rules.length; index += 1) {
    const rule = flag.rules[index];
    if (!ruleMatches(rule, context)) {
      continue;
    }

    // First match wins. A rollout on the matched rule then decides whether
    // this caller is inside the targeted slice; if not, the flag default
    // applies rather than a later rule.
    if (rule.rolloutPercentage !== null) {
      const included = isIncludedInRollout(
        rule.rolloutPercentage,
        flag.rolloutSalt,
        flag.key,
        contextKey
      );
      if (!included) {
        return result(flag.defaultValue, 'rule-rollout-excluded', index);
      }
    }

    return result(rule.value, 'rule-match', index);
  }

  if (flag.rolloutPercentage !== null) {
    const included = isIncludedInRollout(
      flag.rolloutPercentage,
      flag.rolloutSalt,
      flag.key,
      contextKey
    );
    return included
      ? result(flag.defaultValue, 'rollout-included')
      : result(flag.offValue, 'rollout-excluded');
  }

  return result(flag.defaultValue, 'default');
}

export function evaluateFlagSet(
  flags: FlagSnapshot[],
  context: FlagEvaluationContext = {}
): Record<string, FlagValue> {
  const values: Record<string, FlagValue> = {};
  for (const flag of flags) {
    values[flag.key] = evaluateFlag(flag, context).value;
  }
  return values;
}

export function isEnabledValue(value: FlagValue): boolean {
  return value === true;
}
