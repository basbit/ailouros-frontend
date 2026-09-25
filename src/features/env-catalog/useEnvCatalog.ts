import { computed, ref } from "vue";
import {
  type EnvVariableDto,
  fetchEnvCatalog,
  saveEnvOverrides,
} from "@/shared/api/endpoints/env-catalog";
import { applyRestartStatus } from "@/shared/lib/global-search/restart-status";

export interface EnvGroup {
  name: string;
  variables: EnvVariableDto[];
}

export function useEnvCatalog() {
  const variables = ref<EnvVariableDto[]>([]);
  const drafts = ref<Record<string, string>>({});
  const query = ref("");
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const savedNames = ref<string[]>([]);
  const loaded = ref(false);

  async function load(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      variables.value = await fetchEnvCatalog();
      applyRestartStatus({
        restart_pending: variables.value
          .filter((variable) => variable.restart_pending)
          .map((variable) => variable.name),
      });
      drafts.value = {};
      loaded.value = true;
    } catch (err: unknown) {
      error.value = String(err);
    } finally {
      loading.value = false;
    }
  }

  function currentValue(variable: EnvVariableDto): string {
    const draft = drafts.value[variable.name];
    return draft === undefined ? variable.value : draft;
  }

  function setValue(name: string, value: string): void {
    drafts.value = { ...drafts.value, [name]: value };
  }

  function resetToDefault(variable: EnvVariableDto): void {
    setValue(variable.name, "");
  }

  const dirtyNames = computed(() =>
    Object.keys(drafts.value).filter((name) => {
      const variable = variables.value.find((item) => item.name === name);
      return !!variable && drafts.value[name] !== variable.value;
    }),
  );

  const matches = computed<EnvVariableDto[]>(() => {
    const needle = query.value.trim().toLowerCase();
    if (!needle) return variables.value;
    return variables.value.filter(
      (variable) =>
        variable.name.toLowerCase().includes(needle) ||
        variable.description.toLowerCase().includes(needle) ||
        variable.group.toLowerCase().includes(needle),
    );
  });

  const groups = computed<EnvGroup[]>(() => {
    const byGroup = new Map<string, EnvVariableDto[]>();
    for (const variable of matches.value) {
      const bucket = byGroup.get(variable.group) ?? [];
      bucket.push(variable);
      byGroup.set(variable.group, bucket);
    }
    return [...byGroup.entries()]
      .map(([name, groupVariables]) => ({ name, variables: groupVariables }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  async function save(): Promise<void> {
    const names = dirtyNames.value;
    if (!names.length || saving.value) return;
    saving.value = true;
    error.value = null;
    try {
      const payload: Record<string, string> = {};
      for (const name of names) payload[name] = drafts.value[name];
      const result = await saveEnvOverrides(payload);
      savedNames.value = result.updated;
      await load();
      if (result.rejected.length) {
        error.value = `Rejected: ${result.rejected.join(", ")}`;
      }
    } catch (err: unknown) {
      error.value = String(err);
    } finally {
      saving.value = false;
    }
  }

  return {
    variables,
    groups,
    query,
    loading,
    loaded,
    saving,
    error,
    savedNames,
    dirtyNames,
    load,
    save,
    currentValue,
    setValue,
    resetToDefault,
  };
}
