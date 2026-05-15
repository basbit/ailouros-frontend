/**
 * Single source of truth for localStorage JSON I/O (plan §20.3.3).
 *
 * Before this helper, 5+ places re-implemented variants of
 * "JSON.parse(localStorage.getItem(key) ?? 'null')" with subtly
 * different defensive handling — `useRemoteApiProfiles::loadGlobal`,
 * `usePromptLibrary`, `use-swarm-defaults`, `shared/store/preferences`,
 * `App.vue::_readStoredWorkspaceRoot`, `global-search-keys`.
 *
 * Callers should now use `loadJSON<T>(key, defaultValue)` and
 * `saveJSON<T>(key, value)`. Schema-version migration helpers live
 * next door so we have one place to evolve the format.
 */

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Quota exceeded, private-mode Safari, etc — swallow to keep UI
    // running; caller can re-attempt later or just live in-memory.
    return false;
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export function loadJSONWithVersion<T extends { version: number }>(
  key: string,
  expectedVersion: number,
  fallback: T,
  migrate?: (legacy: unknown) => T | null,
): T {
  const raw = loadJSON<unknown>(key, null);
  if (raw && typeof raw === "object" && "version" in raw) {
    const versioned = raw as { version: unknown };
    if (versioned.version === expectedVersion) return raw as T;
    if (migrate) {
      const migrated = migrate(raw);
      if (migrated && migrated.version === expectedVersion) {
        saveJSON(key, migrated);
        return migrated;
      }
    }
  }
  return fallback;
}
