// Blog index added by a pull request you reviewed (static: getStaticProps).
import type { ReactElement } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getAllPosts } from '../../lib/blog-posts';

// The site's address with its basePath (next.config): next/link adds
// basePath and the trailing slash itself; canonical and structured data
// URLs are absolute and built here.
const SITE = 'https://www.keykit.dev';

// The blog's own small style (scoped to .blog-page): these pages render
// outside your app's signed-in layout.
const BLOG_CSS =
  '.blog-page{max-width:44rem;margin:0 auto;padding:2rem 1.25rem 4rem;line-height:1.7;font-size:1.0625rem}.blog-page nav{font-size:.875rem;margin-bottom:1.5rem}.blog-page h1{font-size:2.25rem;line-height:1.2;font-weight:700;margin:0 0 .75rem}.blog-page h2{font-size:1.5rem;line-height:1.3;font-weight:700;margin:2.25rem 0 .75rem}.blog-page h3{font-size:1.25rem;line-height:1.4;font-weight:600;margin:1.75rem 0 .5rem}.blog-page p,.blog-page ul,.blog-page ol,.blog-page table,.blog-page pre,.blog-page blockquote{margin:0 0 1.1rem}.blog-page ul{list-style:disc;padding-left:1.5rem}.blog-page ol{list-style:decimal;padding-left:1.5rem}.blog-page li{margin:.25rem 0}.blog-page a{text-decoration:underline;text-underline-offset:2px}.blog-page time{opacity:.7;font-size:.875rem}.blog-page article time{display:block;margin-bottom:1.5rem}.blog-page pre{overflow-x:auto;padding:1rem;border-radius:6px;background:rgba(127,127,127,.12)}.blog-page code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em}.blog-page table{border-collapse:collapse;width:100%;display:block;overflow-x:auto}.blog-page th,.blog-page td{border:1px solid rgba(127,127,127,.35);padding:.4rem .6rem;text-align:left}.blog-page blockquote{border-left:3px solid rgba(127,127,127,.45);padding-left:1rem}.blog-page img{max-width:100%;height:auto}';

export async function getStaticProps() {
  const posts = getAllPosts().map(({ slug, title, date }) => ({
    slug,
    title,
    date,
  }));
  return { props: { posts } };
}

export default function BlogIndex({
  posts,
}: {
  posts: { slug: string; title: string; date: string }[];
}) {
  return (
    <>
      <Head>
        <title>{'Blog'}</title>
        <meta
          name="description"
          content={'Articles and guides from keykit.dev.'}
          key="description"
        />
        <link rel="canonical" href={`${SITE}/blog`} key="canonical" />
      </Head>
      <main className="blog-page">
        <style>{BLOG_CSS}</style>
        <nav aria-label="Breadcrumb">
          <Link href={'/'}>Home</Link>
        </nav>
        <h1>Blog</h1>
        <ul>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>{' '}
              <time dateTime={post.date}>{post.date.slice(0, 10)}</time>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

// Rendered on its own, not inside the signed-in app layout (_app reads
// getLayout): the blog is public.
BlogIndex.getLayout = (page: ReactElement) => page;
