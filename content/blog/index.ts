// Managed blog index: rewritten with every article added.
// Each post is a module in this folder; add one here to publish it.
import post0 from './duplicate-translation-keys-how-to-find-merge-and-sync-them-back-to-code';
import post1 from './how-to-manage-translation-keys-in-code';
import post2 from './localization-testing-environments-staging-vs-production-for-translations';
import post3 from './nextjs-i18n-setup-keys-locales-runtime-bundles';
import post4 from './software-localization-tools-what-to-check-before-you-pick-one';
import post5 from './translation-keys-discovered-automatically-from-application-code';
import post6 from './unused-and-deprecated-translation-keys-in-a-codebase';
import post7 from './why-spreadsheet-based-localization-breaks-as-your-product-grows';

export interface BlogPostData {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  html: string;
}

export const posts: BlogPostData[] = [post0, post1, post2, post3, post4, post5, post6, post7];
