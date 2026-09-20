import { cn } from 'cn';

import app from '@/lib/app';

import {
  LOGOGRAM_BLUE_PATH,
  LOGOGRAM_ORANGE_PATH,
  LOGOGRAM_TRANSFORM,
  LOGOTYPE_PATH,
  LOGOTYPE_TRANSFORM,
} from './logo/paths';

const FULL_VIEWBOX = '0 0 151.4 42.28';
/** Logotype starts at x≈51; crop to logogram only when sidebar is collapsed. */
const ICON_VIEWBOX = '0 0 52 42.28';

type KeykitLogoProps = {
  collapsed?: boolean;
  className?: string;
  heightClassName?: string;
};

const KeykitLogo = ({
  collapsed = false,
  className,
  heightClassName = 'h-[30px]',
}: KeykitLogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={collapsed ? ICON_VIEWBOX : FULL_VIEWBOX}
      preserveAspectRatio="xMinYMid meet"
      className={cn(
        'w-auto shrink-0 text-foreground transition-[width] duration-200 ease-out',
        heightClassName,
        className
      )}
      role="img"
      aria-label={app.name}
    >
      <g id="logogram" transform={LOGOGRAM_TRANSFORM}>
        <path fill="#FF5900" d={LOGOGRAM_ORANGE_PATH} />
        <path fill="#312ECB" d={LOGOGRAM_BLUE_PATH} />
      </g>
      <g
        id="logotype"
        transform={LOGOTYPE_TRANSFORM}
        className={collapsed ? 'opacity-0' : undefined}
        aria-hidden={collapsed}
      >
        <path fill="currentColor" d={LOGOTYPE_PATH} />
      </g>
    </svg>
  );
};

export default KeykitLogo;
