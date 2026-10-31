// Blog post page added by a pull request you reviewed: one static page per post, built at
// build time (getStaticPaths with fallback: false + getStaticProps: works
// with a static export; no server needed).
import type { ReactElement } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getPost, getPostSlugs, renderPost } from '../../lib/blog-posts';
import type { BlogPost } from '../../lib/blog-posts';

// The site's address with its basePath (next.config): next/link adds
// basePath and the trailing slash itself; canonical and structured data
// URLs are absolute and built here.
const SITE = 'https://keykit.dev';

// The blog's own small style (scoped to .blog-page): these pages render
// outside your app's signed-in layout.
const BLOG_CSS =
  '.blog-page{max-width:44rem;margin:0 auto;padding:2rem 1.25rem 4rem;line-height:1.7;font-size:1.0625rem}.blog-page nav{font-size:.875rem;margin-bottom:1.5rem}.blog-page h1{font-size:2.25rem;line-height:1.2;font-weight:700;margin:0 0 .75rem}.blog-page h2{font-size:1.5rem;line-height:1.3;font-weight:700;margin:2.25rem 0 .75rem}.blog-page h3{font-size:1.25rem;line-height:1.4;font-weight:600;margin:1.75rem 0 .5rem}.blog-page p,.blog-page ul,.blog-page ol,.blog-page table,.blog-page pre,.blog-page blockquote{margin:0 0 1.1rem}.blog-page ul{list-style:disc;padding-left:1.5rem}.blog-page ol{list-style:decimal;padding-left:1.5rem}.blog-page li{margin:.25rem 0}.blog-page a{text-decoration:underline;text-underline-offset:2px}.blog-page time{opacity:.7;font-size:.875rem}.blog-page article time{display:block;margin-bottom:1.5rem}.blog-page pre{overflow-x:auto;padding:1rem;border-radius:6px;background:rgba(127,127,127,.12)}.blog-page code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em}.blog-page table{border-collapse:collapse;width:100%;display:block;overflow-x:auto}.blog-page th,.blog-page td{border:1px solid rgba(127,127,127,.35);padding:.4rem .6rem;text-align:left}.blog-page blockquote{border-left:3px solid rgba(127,127,127,.45);padding-left:1rem}.blog-page img{max-width:100%;height:auto}';

export async function getStaticPaths() {
  return {
    paths: getPostSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) throw new Error(`Blog post ${params.slug} not found`);
  return { props: { post: { ...post, html: await renderPost(post.content) } } };
}

export default function BlogPostPage({
  post,
}: {
  post: BlogPost & { html: string };
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
  };
  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.description} key="description" />
        <link
          rel="canonical"
          href={`${SITE}/blog/${post.slug}`}
          key="canonical"
        />
      </Head>
      <Head>
        <script
          type="application/ld+json"
          key="seo-blogposting"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </Head>
      <main className="blog-page">
        <style>{BLOG_CSS}</style>
        <nav aria-label="Breadcrumb">
          <Link href={'/'}>Home</Link>
          {' / '}
          <Link href={'/blog'}>Blog</Link>
        </nav>
        <article>
          <h1>{post.title}</h1>
          <time dateTime={post.date}>{post.date.slice(0, 10)}</time>
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
      </main>
    </>
  );
}

// Rendered on its own, not inside the signed-in app layout (_app reads
// getLayout): the blog is public.
BlogPostPage.getLayout = (page: ReactElement) => page;
