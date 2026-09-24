import { computed, ref } from "vue";
import type { Ref } from "vue";
import { persistenceAdapter } from "@/shared/lib/persistence-adapter";

/**
 * Focused composables for the single-purpose UI preferences that used to poke
 * `localStorage` directly from pages, widgets and components: a collapsed
 * panel, a sidebar toggle, a dismissed banner.
 *
 * Each returns a writable ref whose setter persists the new value, so a call
 * site never repeats the encoding. There is no watcher and therefore nothing
 * to clean up: the ref may safely be created at module scope or in `setup`.
 */

/**
 * Read a persisted `"1"` / `"0"` flag. Anything else (absent key, unreadable
 * storage, a value written by an older build) falls back to `fallback`.
 */
function readFlag(key: string, fallback: boolean): boolean {
  const raw = persistenceAdapter.readString(key);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return fallback;
}

/** A boolean flag persisted as `"1"` / `"0"` under `key`. */
export function usePersistedFlag(key: string, fallback: boolean): Ref<boolean> {
  const current = ref<boolean>(readFlag(key, fallback));
  return computed<boolean>({
    get: () => current.value,
    set: (next) => {
      current.value = next;
      persistenceAdapter.write(key, next ? "1" : "0");
    },
  });
}

/** A string persisted verbatim under `key`. */
export function usePersistedString(key: string, fallback: string): Ref<string> {
  const current = ref<string>(persistenceAdapter.readString(key) ?? fallback);
  return computed<string>({
    get: () => current.value,
    set: (next) => {
      current.value = next;
      persistenceAdapter.write(key, next);
    },
  });
}
