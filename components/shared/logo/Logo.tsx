import { cn } from 'cn';
import type { SVGProps } from 'react';

import app from '@/lib/app';

import Logogram from './Logogram';
import { LOGO_VIEWBOX, LOGOTYPE_PATH, LOGOTYPE_TRANSFORM } from './paths';

export type LogoProps = SVGProps<SVGSVGElement>;

const Logo = ({ className, ...props }: LogoProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={LOGO_VIEWBOX}
    data-logo="logo"
    role="img"
    aria-label={app.name}
    className={cn('w-auto shrink-0', className)}
    {...props}
  >
    <Logogram />
    <g id="logotype" transform={LOGOTYPE_TRANSFORM}>
      <path fill="#000000" d={LOGOTYPE_PATH} />
    </g>
  </svg>
);

export default Logo;
