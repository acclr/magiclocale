const SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

/**
 * Expire every NextAuth session cookie name.
 * The plain name must not be marked Secure — browsers drop that header on
 * http://localhost and the real session cookie stays. The `__Secure-` name
 * used on HTTPS must include Secure.
 */
export function expiredSessionCookieHeaders(): string[] {
  return SESSION_COOKIE_NAMES.map((name) => {
    const secure = name.startsWith('__Secure-') || name.startsWith('__Host-');
    const attributes = [
      `${name}=`,
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'Max-Age=0',
      'HttpOnly',
      'SameSite=Lax',
    ];

    if (secure) {
      attributes.push('Secure');
    }

    return attributes.join('; ');
  });
}

export function sessionCookieNames(): readonly string[] {
  return SESSION_COOKIE_NAMES;
}
