import packageInfo from '../package.json';
import env from './env';
import { publicSiteOrigin } from './public-site-origin';

const app = {
  version: packageInfo.version,
  name: 'Keykit',
  url: publicSiteOrigin(env.appUrl),
};

export default app;
