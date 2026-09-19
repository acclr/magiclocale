const PUBLIC_SDK_API_PATHS = [
  /^\/api\/v1\/projects\/[^/]+\/keys\/sync$/,
  /^\/api\/v1\/projects\/[^/]+\/translations$/,
  /^\/api\/v1\/projects\/[^/]+\/flags$/,
  /^\/api\/v1\/projects\/[^/]+\/flags\/evaluate$/,
];

export function isPublicSdkApiPath(pathname: string): boolean {
  return PUBLIC_SDK_API_PATHS.some((pattern) => pattern.test(pathname));
}
