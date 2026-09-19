import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'Keykit',
  logoUrl: '/logo.svg',
  logoWhiteUrl: '/logowhite.svg',
  logoSquareUrl: '/logosquare.svg',
  url: env.appUrl,
};

export default app;
