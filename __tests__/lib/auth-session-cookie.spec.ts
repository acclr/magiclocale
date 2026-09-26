import { expiredSessionCookieHeaders } from '../../lib/auth-session-cookie';

describe('expiredSessionCookieHeaders', () => {
  const headers = expiredSessionCookieHeaders();

  it('clears the localhost session cookie without Secure', () => {
    const plain = headers.find((header) =>
      header.startsWith('next-auth.session-token=')
    );

    expect(plain).toBeDefined();
    expect(plain).toContain('Path=/');
    expect(plain).toContain('Max-Age=0');
    expect(plain).toContain('HttpOnly');
    expect(plain).not.toContain('Secure');
  });

  it('clears the HTTPS session cookie with the __Secure- prefix', () => {
    const secure = headers.find((header) =>
      header.startsWith('__Secure-next-auth.session-token=')
    );

    expect(secure).toBeDefined();
    expect(secure).toContain('Path=/');
    expect(secure).toContain('Max-Age=0');
    expect(secure).toContain('HttpOnly');
    expect(secure).toContain('Secure');
  });
});
