import { cn } from 'cn';
import type { SVGProps } from 'react';

import app from '@/lib/app';

import Logogram from './Logogram';
import { LOGO_SQUARE_VIEWBOX } from './paths';

export type LogoSquareProps = SVGProps<SVGSVGElement>;

const LogoSquare = ({ className, ...props }: LogoSquareProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox={LOGO_SQUARE_VIEWBOX}
    data-logo="logo"
    role="img"
    aria-label={app.name}
    className={cn('w-auto shrink-0', className)}
    {...props}
  >
    <Logogram />
  </svg>
);

export default LogoSquare;
