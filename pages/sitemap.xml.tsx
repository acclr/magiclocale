import type { GetServerSideProps } from 'next';

import app from '@/lib/app';
import { marketingSitemapUrls, renderSitemapXml } from '@/lib/seo/sitemap';
import type { NextPageWithLayout } from 'types';

const SiteMap: NextPageWithLayout = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.write(renderSitemapXml(marketingSitemapUrls(app.url)));
  res.end();
  return { props: {} };
};

SiteMap.getLayout = (page) => page;

export default SiteMap;
