/**
 * Raw `localStorage` primitives.
 *
 * `@/shared/lib/persistence-adapter` is the only module allowed to import
 * these: it is the single seam where storage failures are absorbed and where
 * serialization lives. Everything else reads and writes through that adapter
 * or through a focused composable built on it (`use-persisted-flag`,
 * `global-search/persistence`, …).
 */
function requireLocalStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage is not available in this environment");
  }
  return window.localStorage;
}

export function readRawString(key: string): string | null {
  return requireLocalStorage().getItem(key);
}

export function writeRawString(key: string, value: string): void {
  requireLocalStorage().setItem(key, value);
}

export function removeKey(key: string): void {
  requireLocalStorage().removeItem(key);
}
