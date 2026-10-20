import React, { ReactElement } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import router from 'next/router';
import { Button } from '@/components/ui/button';

const Custom404 = () => {
  const { t } = useTranslation('common');
  return (
    <div className="w-full items-center justify-center text-center lg:px-2 xl:px-0">
      <script
        type="application/ld+json"
        data-seo-block="1"
        dangerouslySetInnerHTML={{
          __html:
            '{"@context":"https://schema.org","@type":"WebPage","@id":"https://keykit.dev/404#webpage","url":"https://keykit.dev/404","name":"Keykit","description":"Keykit - Enterprise SaaS Starter Kit","inLanguage":"en","isPartOf":{"@type":"WebSite","@id":"https://keykit.dev/#website","url":"https://keykit.dev/","name":"Keykit"}}',
        }}
      />
      <p className="text-7xl font-bold tracking-wider text-foreground md:text-8xl lg:text-9xl">
        {t('error-404')}
      </p>
      <p className="mt-2 text-4xl font-bold tracking-wider text-foreground md:text-5xl lg:text-6xl">
        {t('page-not-found')}
      </p>
      <p className="my-12 text-lg text-muted-foreground md:text-xl lg:text-2xl">
        {t('sorry-not-found')}
      </p>
      <div className="mt-8 space-x-5">
        <Button asChild>
          <Link href="/">{t('go-home')}</Link>
        </Button>
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
        >
          {t('go-back')}
        </Button>
      </div>
    </div>
  );
};

export default Custom404;

Custom404.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}
