import { ref, type Ref } from "vue";
import {
  ensureModelChoicesForEnv,
  fetchCloudModelsForProfile,
} from "@/shared/lib/use-model-list";
import type { RemoteProfileRow } from "@/shared/model/project-types";

export interface BulkModelCatalogApi {
  bulkModelChoices: Ref<[string, string][]>;
  bulkModelFetchError: Ref<string | null>;
  loadBulkModelChoices: (env: string, profileId: string) => Promise<void>;
}

export function useBulkModelCatalog(profiles: {
  value: RemoteProfileRow[];
}): BulkModelCatalogApi {
  const bulkModelChoices = ref<[string, string][]>([]);
  const bulkModelFetchError = ref<string | null>(null);

  async function loadBulkModelChoices(env: string, profileId: string): Promise<void> {
    bulkModelFetchError.value = null;
    if (!env || (env === "cloud" && !profileId.trim())) {
      bulkModelChoices.value = [];
      return;
    }
    try {
      bulkModelChoices.value =
        env === "cloud"
          ? await fetchCloudModelsForProfile(resolveProfile(profileId))
          : await ensureModelChoicesForEnv(env);
    } catch (e) {
      bulkModelChoices.value = [];
      bulkModelFetchError.value = e instanceof Error ? e.message : String(e);
    }
  }

  function resolveProfile(profileId: string): RemoteProfileRow {
    const row = profiles.value.find((profile) => profile.id === profileId);
    if (!row) throw new Error(`Unknown cloud profile '${profileId}'`);
    return row;
  }

  return { bulkModelChoices, bulkModelFetchError, loadBulkModelChoices };
}
