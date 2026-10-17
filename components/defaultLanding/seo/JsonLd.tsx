import Head from 'next/head';

import { jsonLdScript } from '@/lib/seo/json-ld';

const JsonLd = ({ data }: { data: unknown }) => {
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
      />
    </Head>
  );
};

export default JsonLd;
