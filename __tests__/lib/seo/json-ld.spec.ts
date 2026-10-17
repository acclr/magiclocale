import {
  faqPageJsonLd,
  jsonLdScript,
  organizationJsonLd,
} from '@/lib/seo/json-ld';

describe('json-ld', () => {
  it('describes the organization', () => {
    expect(
      organizationJsonLd({
        name: 'Keykit',
        url: 'https://www.keykit.dev',
        logo: 'https://www.keykit.dev/logo.svg',
        description: 'Product copy, localized.',
      })
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Keykit',
      url: 'https://www.keykit.dev',
      logo: 'https://www.keykit.dev/logo.svg',
      description: 'Product copy, localized.',
    });
  });

  it('describes an FAQ page from visible questions', () => {
    expect(
      faqPageJsonLd([
        { question: 'What is Keykit?', answer: 'A translation platform.' },
      ])
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Keykit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A translation platform.',
          },
        },
      ],
    });
  });

  it('escapes closing script tags in embedded JSON', () => {
    expect(jsonLdScript({ text: '</script><script>' })).toBe(
      '{"text":"\\u003c/script>\\u003cscript>"}'
    );
  });
});
