import { readRawString, removeKey, writeRawString } from "@/shared/lib/storage-utils";
import { LS_SETTINGS } from "@/shared/lib/swarm-ui-constants";

export interface PersistenceAdapter {
  read(key: string): unknown | null;
  readString(key: string): string | null;
  write(key: string, value: unknown): void;
  remove(key: string): void;
}

function parseStored(raw: string | null): unknown | null {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export const persistenceAdapter: PersistenceAdapter = {
  read(key) {
    try {
      return parseStored(readRawString(key));
    } catch {
      return null;
    }
  },
  readString(key) {
    try {
      return readRawString(key);
    } catch {
      return null;
    }
  },
  write(key, value) {
    try {
      const payload = typeof value === "string" ? value : JSON.stringify(value);
      writeRawString(key, payload);
    } catch {
      // Persistence is best-effort; callers must not rely on a throw.
    }
  },
  remove(key) {
    try {
      removeKey(key);
    } catch {
      // Persistence is best-effort; callers must not rely on a throw.
    }
  },
};

/** Load the legacy single-project settings blob migrated into projects. */
export function readLegacySettings(): unknown | null {
  return persistenceAdapter.read(LS_SETTINGS);
}

/**
 * Read `key`; when nothing is stored there yet, fall back to the legacy
 * `legacyKey` and copy it into `key`. Used to migrate project-scoped storage
 * keys from the earlier single-key format. Pass `null` as `legacyKey` to
 * disable the legacy fallback (e.g. for non-default projects).
 */
export function readWithLegacyCopy(
  key: string,
  legacyKey: string | null,
): string | null {
  let raw = persistenceAdapter.readString(key);
  if ((raw == null || raw === "") && legacyKey != null) {
    const leg = persistenceAdapter.readString(legacyKey);
    if (leg != null) {
      persistenceAdapter.write(key, leg);
      raw = leg;
    }
  }
  return raw;
}
