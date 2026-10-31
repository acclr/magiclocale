// Blog posts reader added by a pull request you reviewed.
// Posts are data modules in content/blog (one per post, with its HTML
// already rendered), listed by content/blog/index; nothing is parsed at
// build time and no package is needed.
import { posts } from '../content/blog/index';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  content: string;
}

export function getPostSlugs(): string[] {
  return posts.map((p) => p.slug);
}

export function getPost(slug: string): BlogPost | null {
  const p = posts.find((x) => x.slug === slug);
  if (!p) return null;
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: (isNaN(new Date(p.date).getTime())
      ? new Date(0)
      : new Date(p.date)
    ).toISOString(),
    content: p.html,
  };
}

export function getAllPosts(): BlogPost[] {
  return getPostSlugs()
    .map(getPost)
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function renderPost(content: string): Promise<string> {
  return content;
}
