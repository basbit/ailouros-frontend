import {
  useGlobalSearchKeys,
  type GlobalSearchKeysState as GlobalSettingsData,
} from "@/shared/lib/global-search-keys";

export function useGlobalSettings() {
  return useGlobalSearchKeys();
}

export type { GlobalSettingsData };
