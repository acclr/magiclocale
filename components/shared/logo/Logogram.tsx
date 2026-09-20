import {
  LOGOGRAM_BLUE_PATH,
  LOGOGRAM_ORANGE_PATH,
  LOGOGRAM_TRANSFORM,
} from './paths';

const Logogram = () => (
  <g id="logogram" transform={LOGOGRAM_TRANSFORM}>
    <path fill="#FF5900" d={LOGOGRAM_ORANGE_PATH} />
    <path fill="#312ECB" d={LOGOGRAM_BLUE_PATH} />
  </g>
);

export default Logogram;
