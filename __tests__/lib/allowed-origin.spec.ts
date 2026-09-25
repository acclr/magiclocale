import {
  AllowedOriginError,
  parseAllowedOrigin,
  parseAllowedOrigins,
} from '../../lib/api/allowed-origin';

describe('parseAllowedOrigin', () => {
  it('normalizes scheme, host, and port and strips a trailing slash', () => {
    expect(parseAllowedOrigin('https://App.Example.com/')).toBe(
      'https://app.example.com'
    );
    expect(parseAllowedOrigin('http://localhost:3000')).toBe(
      'http://localhost:3000'
    );
  });

  it('rejects paths, credentials, and non-http schemes', () => {
    expect(() => parseAllowedOrigin('https://app.example.com/app')).toThrow(
      AllowedOriginError
    );
    expect(() => parseAllowedOrigin('https://user:pass@app.example.com')).toThrow(
      AllowedOriginError
    );
    expect(() => parseAllowedOrigin('ftp://files.example.com')).toThrow(
      AllowedOriginError
    );
    expect(() => parseAllowedOrigin('app.example.com')).toThrow(
      AllowedOriginError
    );
  });

  it('deduplicates a list of origins', () => {
    expect(
      parseAllowedOrigins([
        'https://app.example.com/',
        'https://app.example.com',
        'http://localhost:3000',
      ])
    ).toEqual(['https://app.example.com', 'http://localhost:3000']);
  });
});
