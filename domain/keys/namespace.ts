export function namespaceFromKey(key: string): string | null {
  const trimmed = key.trim();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0) {
    return null;
  }
  return trimmed.slice(0, lastDot);
}

export function namespaceDepth(namespace: string | null | undefined): number {
  if (!namespace) {
    return 0;
  }
  return namespace.split('.').filter(Boolean).length;
}

export function rootNamespace(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed) {
    return null;
  }
  const dot = trimmed.indexOf('.');
  return dot === -1 ? trimmed : trimmed.slice(0, dot);
}
