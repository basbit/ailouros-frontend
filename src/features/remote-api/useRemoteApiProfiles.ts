/**
 * useRemoteApiProfiles — manages remote API provider profiles.
 *
 * Authoritative persistence is project-scoped via SettingsSnap / `.swarm/settings.json`.
 * `loadGlobal()` remains only as a legacy localStorage migration path.
 */
import { ref } from "vue";
import type { RemoteProfileRow } from "@/shared/store/projects";
import {
  defaultRemoteApiBaseUrl,
  defaultRemoteApiProvider,
  remoteProfileProviderOptions,
} from "@/shared/lib/use-swarm-defaults";
import { LS_REMOTE_PROFILES } from "@/shared/lib/swarm-ui-constants";

export function getRemoteProfileProviderOptions(): [string, string][] {
  return remoteProfileProviderOptions();
}

export function useRemoteApiProfiles(onChangeCb: () => void) {
  const profiles = ref<RemoteProfileRow[]>([]);

  function loadGlobal(): void {
    try {
      const raw = localStorage.getItem(LS_REMOTE_PROFILES);
      if (raw) {
        const arr = JSON.parse(raw) as RemoteProfileRow[];
        if (Array.isArray(arr)) {
          profiles.value = arr;
          return;
        }
      }
    } catch {
      /* ignore */
    }
    profiles.value = [];
  }

  function saveGlobal(): void {
    // Project-scoped persistence is handled by useSettings → collectSnap().
  }

  function addProfile(data: Partial<RemoteProfileRow> = {}): void {
    const prov = data.provider ?? defaultRemoteApiProvider();
    const baseUrl = data.base_url ?? defaultRemoteApiBaseUrl(prov);
    profiles.value.push({
      id: data.id ?? "",
      provider: prov,
      api_key: data.api_key ?? "",
      base_url: baseUrl,
    });
    onChangeCb();
    saveGlobal();
  }

  function removeProfile(idx: number): void {
    profiles.value.splice(idx, 1);
    onChangeCb();
    saveGlobal();
  }

  function updateProfile(
    idx: number,
    field: keyof RemoteProfileRow,
    value: string,
  ): void {
    const p = profiles.value[idx];
    if (!p) return;
    if (field === "provider") {
      // Auto-fill base_url when provider changes and url is empty
      if (!p.base_url.trim()) {
        p.base_url = defaultRemoteApiBaseUrl(value);
      }
    }
    (p as Record<string, string>)[field] = value;
    onChangeCb();
    saveGlobal();
  }

  function applyFromArray(arr: RemoteProfileRow[]): void {
    profiles.value = Array.isArray(arr) ? arr.filter((r) => r.id) : [];
  }

  function collectForSnap(): RemoteProfileRow[] {
    return profiles.value.filter((r) => r.id.trim());
  }

  function collectAsObject(): Record<
    string,
    { provider: string; api_key?: string; base_url?: string }
  > {
    const out: Record<
      string,
      { provider: string; api_key?: string; base_url?: string }
    > = {};
    for (const r of profiles.value) {
      const id = r.id.trim();
      if (!id) continue;
      const entry: { provider: string; api_key?: string; base_url?: string } = {
        provider: r.provider,
      };
      if (r.api_key) entry.api_key = r.api_key;
      if (r.base_url) entry.base_url = r.base_url;
      out[id] = entry;
    }
    return out;
  }

  function getDuplicateIds(): string[] {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const r of profiles.value) {
      const id = r.id.trim();
      if (!id) continue;
      if (seen.has(id)) dups.push(id);
      seen.add(id);
    }
    return dups;
  }

  function getProviderForId(profileId: string): string {
    const row = profiles.value.find((p) => p.id === profileId);
    return row?.provider ?? defaultRemoteApiProvider();
  }

  /** Migrate old JSON string format to rows (legacy compat). */
  function migrateJsonStringToRows(jsonStr: string): void {
    let obj: unknown;
    try {
      obj = JSON.parse(jsonStr);
    } catch {
      return;
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
    const map = obj as Record<
      string,
      { provider?: string; api_key?: string; base_url?: string }
    >;
    profiles.value = [];
    for (const [k, v] of Object.entries(map)) {
      if (!v || typeof v !== "object") continue;
      profiles.value.push({
        id: k,
        provider: String(v.provider ?? defaultRemoteApiProvider()),
        api_key: String(v.api_key ?? ""),
        base_url: String(v.base_url ?? ""),
      });
    }
  }

  return {
    profiles,
    loadGlobal,
    saveGlobal,
    addProfile,
    removeProfile,
    updateProfile,
    applyFromArray,
    collectForSnap,
    collectAsObject,
    getDuplicateIds,
    getProviderForId,
    migrateJsonStringToRows,
  };
}
