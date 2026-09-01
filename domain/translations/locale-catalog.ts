export type LocaleFormat = 'language' | 'regional';

export class LocaleCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocaleCatalogError';
  }
}

export type LocaleOption = {
  code: string;
  format: LocaleFormat;
  language: string;
  region?: string;
  flag: string;
  englishName: string;
  nativeName: string;
  label: string;
  searchText: string;
};

const ISO_639_1_CODES = (
  'aa ab ae af ak am an ar as av ay az ba be bg bi bm bn bo br bs ' +
  'ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ' +
  'ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ' +
  'ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv ' +
  'mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny ' +
  'oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ' +
  'ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'
).split(' ');

const REGIONAL_CODES = (
  'en-US en-GB en-AU en-CA en-NZ en-IE en-IN en-ZA en-SG en-PH ' +
  'sv-SE sv-FI ' +
  'da-DK ' +
  'nb-NO nn-NO no-NO ' +
  'de-DE de-AT de-CH de-LU ' +
  'fr-FR fr-CA fr-BE fr-CH ' +
  'es-ES es-MX es-AR es-CO es-CL es-US es-PE es-VE ' +
  'pt-BR pt-PT ' +
  'it-IT it-CH ' +
  'nl-NL nl-BE ' +
  'pl-PL fi-FI ru-RU uk-UA tr-TR cs-CZ hu-HU ro-RO el-GR bg-BG ' +
  'hr-HR sk-SK sl-SI lt-LT lv-LV et-EE is-IS ga-IE cy-GB mt-MT ' +
  'ca-ES eu-ES gl-ES ' +
  'sr-RS bs-BA mk-MK sq-AL lb-LU fo-FO kl-GL se-NO se-SE ' +
  'ar-SA ar-EG ar-AE ar-MA he-IL fa-IR ur-PK ps-AF ku-TR ' +
  'ja-JP ko-KR zh-CN zh-TW zh-HK zh-SG th-TH vi-VN id-ID ms-MY ' +
  'hi-IN bn-BD bn-IN ta-IN ta-LK te-IN ml-IN kn-IN gu-IN pa-IN ' +
  'af-ZA sw-KE sw-TZ am-ET ne-NP si-LK my-MM km-KH lo-LA ' +
  'hy-AM ka-GE az-AZ kk-KZ uz-UZ mn-MN ' +
  'tl-PH fil-PH'
).split(' ');

const POPULAR_LANGUAGE_CODES = [
  'en',
  'sv',
  'da',
  'nb',
  'nn',
  'no',
  'de',
  'fr',
  'es',
  'pt',
  'it',
  'nl',
  'fi',
  'pl',
  'ru',
  'uk',
  'ja',
  'zh',
  'ko',
  'ar',
];

const POPULAR_REGIONAL_CODES = [
  'en-GB',
  'en-US',
  'sv-SE',
  'da-DK',
  'nb-NO',
  'nn-NO',
  'de-DE',
  'fr-FR',
  'es-ES',
  'pt-BR',
  'pt-PT',
  'it-IT',
  'nl-NL',
  'fi-FI',
  'zh-CN',
  'zh-TW',
  'ja-JP',
];

const LABEL_OVERRIDES: Record<
  string,
  { englishName: string; nativeName: string }
> = {
  nb: { englishName: 'Norwegian', nativeName: 'Norska (Norskt bokmål)' },
  nn: { englishName: 'Norwegian', nativeName: 'Norska (Nynorska)' },
  no: { englishName: 'Norwegian', nativeName: 'Norska' },
  sv: { englishName: 'Swedish', nativeName: 'Svenska' },
  da: { englishName: 'Danish', nativeName: 'Dansk' },
  'nb-NO': {
    englishName: 'Norwegian',
    nativeName: 'Norska (Norskt bokmål)',
  },
  'nn-NO': { englishName: 'Norwegian', nativeName: 'Norska (Nynorska)' },
  'no-NO': { englishName: 'Norwegian', nativeName: 'Norska' },
  'sv-SE': { englishName: 'Swedish', nativeName: 'Svenska' },
  'sv-FI': { englishName: 'Swedish (Finland)', nativeName: 'Svenska' },
  'da-DK': { englishName: 'Danish', nativeName: 'Dansk' },
};

const DEFAULT_REGION: Record<string, string> = {
  aa: 'ER',
  ab: 'GE',
  af: 'ZA',
  ak: 'GH',
  am: 'ET',
  an: 'ES',
  ar: 'SA',
  as: 'IN',
  av: 'RU',
  ay: 'BO',
  az: 'AZ',
  ba: 'RU',
  be: 'BY',
  bg: 'BG',
  bi: 'VU',
  bm: 'ML',
  bn: 'BD',
  bo: 'CN',
  br: 'FR',
  bs: 'BA',
  ca: 'ES',
  ce: 'RU',
  ch: 'GU',
  co: 'FR',
  cr: 'CA',
  cs: 'CZ',
  cu: 'RU',
  cv: 'RU',
  cy: 'GB',
  da: 'DK',
  de: 'DE',
  dv: 'MV',
  dz: 'BT',
  ee: 'GH',
  el: 'GR',
  en: 'US',
  es: 'ES',
  et: 'EE',
  eu: 'ES',
  fa: 'IR',
  ff: 'SN',
  fi: 'FI',
  fj: 'FJ',
  fo: 'FO',
  fr: 'FR',
  fy: 'NL',
  ga: 'IE',
  gd: 'GB',
  gl: 'ES',
  gn: 'PY',
  gu: 'IN',
  gv: 'IM',
  ha: 'NG',
  he: 'IL',
  hi: 'IN',
  ho: 'PG',
  hr: 'HR',
  ht: 'HT',
  hu: 'HU',
  hy: 'AM',
  hz: 'NA',
  id: 'ID',
  ig: 'NG',
  ii: 'CN',
  ik: 'US',
  is: 'IS',
  it: 'IT',
  iu: 'CA',
  ja: 'JP',
  jv: 'ID',
  ka: 'GE',
  kg: 'CG',
  ki: 'KE',
  kj: 'AO',
  kk: 'KZ',
  kl: 'GL',
  km: 'KH',
  kn: 'IN',
  ko: 'KR',
  kr: 'NE',
  ks: 'IN',
  ku: 'IQ',
  kv: 'RU',
  kw: 'GB',
  ky: 'KG',
  la: 'VA',
  lb: 'LU',
  lg: 'UG',
  li: 'NL',
  ln: 'CD',
  lo: 'LA',
  lt: 'LT',
  lu: 'CD',
  lv: 'LV',
  mg: 'MG',
  mh: 'MH',
  mi: 'NZ',
  mk: 'MK',
  ml: 'IN',
  mn: 'MN',
  mr: 'IN',
  ms: 'MY',
  mt: 'MT',
  my: 'MM',
  na: 'NR',
  nb: 'NO',
  nd: 'ZW',
  ne: 'NP',
  ng: 'NA',
  nl: 'NL',
  nn: 'NO',
  no: 'NO',
  nr: 'ZA',
  nv: 'US',
  ny: 'MW',
  oc: 'FR',
  oj: 'CA',
  om: 'ET',
  or: 'IN',
  os: 'GE',
  pa: 'IN',
  pl: 'PL',
  ps: 'AF',
  pt: 'PT',
  qu: 'PE',
  rm: 'CH',
  rn: 'BI',
  ro: 'RO',
  ru: 'RU',
  rw: 'RW',
  sa: 'IN',
  sc: 'IT',
  sd: 'PK',
  se: 'NO',
  sg: 'CF',
  si: 'LK',
  sk: 'SK',
  sl: 'SI',
  sm: 'WS',
  sn: 'ZW',
  so: 'SO',
  sq: 'AL',
  sr: 'RS',
  ss: 'SZ',
  st: 'LS',
  su: 'ID',
  sv: 'SE',
  sw: 'TZ',
  ta: 'IN',
  te: 'IN',
  tg: 'TJ',
  th: 'TH',
  ti: 'ER',
  tk: 'TM',
  tl: 'PH',
  tn: 'BW',
  to: 'TO',
  tr: 'TR',
  ts: 'ZA',
  tt: 'RU',
  tw: 'GH',
  ty: 'PF',
  ug: 'CN',
  uk: 'UA',
  ur: 'PK',
  uz: 'UZ',
  ve: 'ZA',
  vi: 'VN',
  wa: 'BE',
  wo: 'SN',
  xh: 'ZA',
  yi: 'IL',
  yo: 'NG',
  za: 'CN',
  zh: 'CN',
  zu: 'ZA',
};

const LANGUAGE_SET = new Set(ISO_639_1_CODES);
const REGIONAL_SET = new Set(REGIONAL_CODES);
const optionCache = new Map<string, LocaleOption>();

export function inferLocaleFormat(code: string): LocaleFormat {
  return normalizeLocaleTag(code).includes('-') ? 'regional' : 'language';
}

export function defaultLocaleForFormat(format: LocaleFormat): string {
  return format === 'regional' ? 'en-GB' : 'en';
}

export function localeFormatError(format: LocaleFormat): string {
  return format === 'regional'
    ? 'Choose a regional code from the list (for example en-GB, sv-SE, or nb-NO).'
    : 'Choose a language code from the list (for example en, sv, or da).';
}

export function normalizeLocaleTag(code: string): string {
  const parts = code.trim().replace(/_/g, '-').split('-').filter(Boolean);
  if (parts.length === 0) {
    return '';
  }

  const language = parts[0].toLowerCase();
  if (parts.length === 1) {
    return language;
  }

  const region = parts[1];
  const canonicalRegion =
    region.length === 2 ? region.toUpperCase() : region.toLowerCase();
  return `${language}-${canonicalRegion}`;
}

export function isCatalogLocale(code: string, format?: LocaleFormat): boolean {
  const normalized = normalizeLocaleTag(code);
  if (!normalized) {
    return false;
  }
  if (format === 'language') {
    return LANGUAGE_SET.has(normalized);
  }
  if (format === 'regional') {
    return REGIONAL_SET.has(normalized);
  }
  return LANGUAGE_SET.has(normalized) || REGIONAL_SET.has(normalized);
}

export function requireCatalogLocale(
  code: string,
  format: LocaleFormat
): string {
  const normalized = normalizeLocaleTag(code);
  if (!isCatalogLocale(normalized, format)) {
    throw new LocaleCatalogError(localeFormatError(format));
  }
  return normalized;
}

export function getLocaleOption(code: string): LocaleOption | undefined {
  const normalized = normalizeLocaleTag(code);
  if (LANGUAGE_SET.has(normalized)) {
    return localeOption(normalized, 'language');
  }
  if (REGIONAL_SET.has(normalized)) {
    return localeOption(normalized, 'regional');
  }
  return undefined;
}

export function getLocaleDisplay(code: string): LocaleOption {
  return (
    getLocaleOption(code) ?? {
      code,
      format: inferLocaleFormat(code),
      language: normalizeLocaleTag(code).split('-')[0] || code,
      flag: '',
      englishName: code,
      nativeName: code,
      label: code,
      searchText: code.toLowerCase(),
    }
  );
}

export function catalogOptions(
  format: LocaleFormat | 'any' = 'language'
): LocaleOption[] {
  if (format === 'any') {
    return [
      ...ISO_639_1_CODES.map((code) => localeOption(code, 'language')),
      ...REGIONAL_CODES.map((code) => localeOption(code, 'regional')),
    ];
  }
  const codes = format === 'regional' ? REGIONAL_CODES : ISO_639_1_CODES;
  return codes.map((code) => localeOption(code, format));
}

export function searchLocales(
  query: string,
  format: LocaleFormat | 'any',
  exclude: readonly string[] = []
): LocaleOption[] {
  const excluded = new Set(exclude.map((code) => normalizeLocaleTag(code)));
  const needle = query.trim().toLowerCase();
  const options = catalogOptions(format).filter(
    (option) => !excluded.has(option.code)
  );

  const filtered = needle
    ? options.filter((option) => option.searchText.includes(needle))
    : options;

  return [...filtered].sort((left, right) =>
    compareLocaleOptions(left, right, needle)
  );
}

export function matchCatalogLocale(
  query: string,
  format: LocaleFormat | 'any',
  exclude: readonly string[] = []
): LocaleOption | undefined {
  const normalized = normalizeLocaleTag(query);
  if (!normalized) {
    return undefined;
  }

  const excluded = new Set(exclude.map((code) => normalizeLocaleTag(code)));
  if (excluded.has(normalized)) {
    return undefined;
  }

  if (format === 'any' || format === 'language') {
    if (LANGUAGE_SET.has(normalized)) {
      return localeOption(normalized, 'language');
    }
  }
  if (format === 'any' || format === 'regional') {
    if (REGIONAL_SET.has(normalized)) {
      return localeOption(normalized, 'regional');
    }
  }
  return undefined;
}

function localeOption(code: string, format: LocaleFormat): LocaleOption {
  const cached = optionCache.get(code);
  if (cached) {
    return cached;
  }

  const [language, region] = code.split('-');
  const override = LABEL_OVERRIDES[code];
  const englishLanguage = prettyName(
    displayName('en', language, 'language') || language
  );
  const nativeLanguage = prettyName(
    displayName(language, language, 'language') || englishLanguage
  );
  const regionName = region
    ? prettyName(displayName('en', region, 'region') || region)
    : undefined;
  const englishName = override?.englishName
    ? override.englishName
    : regionName
      ? `${englishLanguage} (${regionName})`
      : englishLanguage;
  const nativeName = override?.nativeName ?? nativeLanguage;
  const label =
    nativeName.toLowerCase() === englishName.toLowerCase()
      ? englishName
      : `${englishName} / ${nativeName}`;
  const flagRegion = region ?? DEFAULT_REGION[language];
  const option: LocaleOption = {
    code,
    format,
    language,
    region,
    flag: flagRegion ? flagEmoji(flagRegion) : '',
    englishName,
    nativeName,
    label,
    searchText: [code, englishName, nativeName, regionName, label]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  };
  optionCache.set(code, option);
  return option;
}

function compareLocaleOptions(
  left: LocaleOption,
  right: LocaleOption,
  needle: string
): number {
  if (needle) {
    const leftExact = Number(left.code.toLowerCase() === needle);
    const rightExact = Number(right.code.toLowerCase() === needle);
    if (leftExact !== rightExact) {
      return rightExact - leftExact;
    }
    const leftStarts = Number(left.code.toLowerCase().startsWith(needle));
    const rightStarts = Number(right.code.toLowerCase().startsWith(needle));
    if (leftStarts !== rightStarts) {
      return rightStarts - leftStarts;
    }
  }

  const popularity = popularityRank(left) - popularityRank(right);
  if (popularity !== 0) {
    return popularity;
  }
  return left.label.localeCompare(right.label);
}

function popularityRank(option: LocaleOption): number {
  const popular =
    option.format === 'regional'
      ? POPULAR_REGIONAL_CODES
      : POPULAR_LANGUAGE_CODES;
  const index = popular.indexOf(option.code);
  return index === -1 ? popular.length : index;
}

function displayName(
  locale: string,
  code: string,
  type: 'language' | 'region'
): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type, fallback: 'code' }).of(code) ??
      code
    );
  } catch {
    return code;
  }
}

function prettyName(value: string): string {
  return value.replace(/(^|[\s(/-])([a-z])/g, (chunk) => chunk.toUpperCase());
}

function flagEmoji(region: string): string {
  const country = region.toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return '';
  }
  return String.fromCodePoint(
    ...Array.from(country).map((char) => 127397 + char.charCodeAt(0))
  );
}
