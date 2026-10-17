import type { GetServerSideProps } from 'next';

import app from '@/lib/app';
import { renderRobotsTxt } from '@/lib/seo/sitemap';
import type { NextPageWithLayout } from 'types';

const Robots: NextPageWithLayout = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.write(renderRobotsTxt(app.url));
  res.end();
  return { props: {} };
};

Robots.getLayout = (page) => page;

export default Robots;
