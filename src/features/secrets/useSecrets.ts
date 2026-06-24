import { ref } from "vue";

import {
  listSecretNames,
  saveSecret,
  deleteSecret,
} from "@/shared/api/endpoints/secrets";

export function useSecrets() {
  const names = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function refresh(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      names.value = await listSecretNames();
    } catch (requestError: unknown) {
      error.value =
        requestError instanceof Error ? requestError.message : String(requestError);
    } finally {
      loading.value = false;
    }
  }

  async function save(name: string, value: string): Promise<void> {
    await saveSecret(name, value);
    await refresh();
  }

  async function remove(name: string): Promise<void> {
    await deleteSecret(name);
    await refresh();
  }

  return { names, loading, error, refresh, save, remove };
}
