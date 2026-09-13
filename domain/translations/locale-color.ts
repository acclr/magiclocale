export type LocaleColor = {
  hex: string;
  background: string;
  border: string;
  onHex: string;
};

function hashLocale(locale: string): number {
  let hash = 2166136261;
  const normalized = locale.trim().toLowerCase();
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hueForLocale(locale: string): number {
  return Math.round((hashLocale(locale) * 137.508) % 360);
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const sat = saturation / 100;
  const light = lightness / 100;
  const chroma = sat * Math.min(light, 1 - light);
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    const value = light - chroma * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

function hexLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000;
}

const COLUMN_WASH_ALPHA = '14'; // ~8% of the locale hex over the dark surface

export function localeColor(locale: string): LocaleColor {
  const hue = hueForLocale(locale || 'und');
  const hex = hslToHex(hue, 62, 42);
  return {
    hex,
    background: `${hex}${COLUMN_WASH_ALPHA}`,
    border: hslToHex(hue, 58, 38),
    onHex: hexLuminance(hex) > 155 ? '#111827' : '#ffffff',
  };
}
