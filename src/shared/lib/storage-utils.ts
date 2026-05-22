export interface TypedStorageKey<T> {
  key: string;
  default: T;
}

function requireLocalStorage(): Storage {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage is not available in this environment");
  }
  return window.localStorage;
}

export function loadJSON<T>(key: string, fallback: T): T {
  const raw = requireLocalStorage().getItem(key);
  if (raw == null || raw === "") return fallback;
  const parsed = JSON.parse(raw) as unknown;
  if (parsed === null || parsed === undefined) return fallback;
  return parsed as T;
}

function saveJSON<T>(key: string, value: T): void {
  requireLocalStorage().setItem(key, JSON.stringify(value));
}

export function readTyped<T>(typed: TypedStorageKey<T>): T {
  return loadJSON<T>(typed.key, typed.default);
}

export function writeTyped<T>(typed: TypedStorageKey<T>, value: T): void {
  saveJSON<T>(typed.key, value);
}

export function readRawString(key: string): string | null {
  return requireLocalStorage().getItem(key);
}

export function writeRawString(key: string, value: string): void {
  requireLocalStorage().setItem(key, value);
}
