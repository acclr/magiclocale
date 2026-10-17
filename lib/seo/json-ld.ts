export type FaqEntry = {
  question: string;
  answer: string;
};

export type OrganizationJsonLdInput = {
  name: string;
  url: string;
  logo: string;
  description: string;
};

export function organizationJsonLd({
  name,
  url,
  logo,
  description,
}: OrganizationJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
  };
}

export function faqPageJsonLd(items: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/** Keep `</script>` out of the embedded JSON. */
export function jsonLdScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
