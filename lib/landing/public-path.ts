import { matchLocalePath } from '@keykithq/sdk/routing';

import { landingRouting } from '../../content/landing/site';

export function isPublicLandingPath(pathname: string): boolean {
  return matchLocalePath(pathname, landingRouting) !== null;
}
