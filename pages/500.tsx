import React, { ReactElement } from 'react';
import { AccountLayout } from '@/components/layouts';
import { useTranslation } from '@/hooks/useTranslation';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import router from 'next/router';
import { Button } from '@/components/ui/button';

const Custom500 = () => {
  const { t } = useTranslation('common');
  return (
    <div className="w-full items-center justify-center text-center lg:px-2 xl:px-0">
      <p className="text-7xl font-bold tracking-wider text-foreground md:text-8xl lg:text-9xl">
        {t('error-500')}
      </p>
      <p className="mt-2 text-4xl font-bold tracking-wider text-foreground md:text-5xl lg:text-6xl">
        {t('internal-server-error')}
      </p>
      <p className="my-12 text-lg text-muted-foreground md:text-xl lg:text-2xl">
        {t('unable-to-find')}
      </p>
      <div className="mt-8 space-x-5">
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
        >
          {t('go-back')}
        </Button>
        <p className="my-12 text-lg text-muted-foreground md:text-xl lg:text-2xl">
          {t('try-again-later')}
        </p>
      </div>
    </div>
  );
};

export default Custom500;

Custom500.getLayout = function getLayout(page: ReactElement) {
  return <AccountLayout>{page}</AccountLayout>;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}
