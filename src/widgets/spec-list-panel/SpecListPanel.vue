<template>
  <section class="spec-list-panel">
    <header class="spec-list-panel__head">
      <span class="spec-list-panel__title">{{ t("specList.title") }}</span>
      <span v-if="specIds.length" class="spec-list-panel__count">
        {{ specIds.length }}
      </span>
      <button
        type="button"
        class="spec-list-panel__reload"
        :disabled="loading"
        @click="reload"
      >
        ↻
      </button>
    </header>
    <div v-if="!workspaceRoot" class="spec-list-panel__hint">
      {{ t("specList.noWorkspace") }}
    </div>
    <div v-else-if="loading" class="spec-list-panel__hint">
      {{ t("specList.loading") }}
    </div>
    <div v-else-if="error" class="spec-list-panel__error">{{ error }}</div>
    <div v-else-if="specIds.length === 0" class="spec-list-panel__hint">
      {{ t("specList.empty") }}
      <button
        type="button"
        class="spec-list-panel__init"
        :disabled="initBusy"
        @click="bootstrap"
      >
        {{ t("specList.init") }}
      </button>
    </div>
    <ul v-else class="spec-list-panel__list">
      <li
        v-for="specId in specIds"
        :key="specId"
        class="spec-list-panel__item"
        :class="{ 'spec-list-panel__item--active': specId === selectedSpecId }"
        @click="emit('select', specId)"
      >
        <code class="spec-list-panel__id">{{ specId }}</code>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { getSpecInit, getSpecList } from "@/shared/api/endpoints/spec";
import { useI18n } from "@/shared/lib/i18n";

const props = withDefaults(
  defineProps<{
    workspaceRoot: string;
    selectedSpecId?: string | null;
    autoLoad?: boolean;
  }>(),
  { selectedSpecId: null, autoLoad: true },
);

const emit = defineEmits<{ select: [specId: string] }>();

const { t } = useI18n();
const specIds = ref<string[]>([]);
const loading = ref(false);
const initBusy = ref(false);
const error = ref<string | null>(null);

async function reload(): Promise<void> {
  if (!props.workspaceRoot) {
    specIds.value = [];
    error.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const dto = await getSpecList(props.workspaceRoot);
    specIds.value = dto.spec_ids ?? [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    specIds.value = [];
  } finally {
    loading.value = false;
  }
}

async function bootstrap(): Promise<void> {
  if (initBusy.value || !props.workspaceRoot) return;
  initBusy.value = true;
  error.value = null;
  try {
    await getSpecInit({ workspace_root: props.workspaceRoot });
    await reload();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    initBusy.value = false;
  }
}

onMounted(() => {
  if (props.autoLoad) void reload();
});

watch(
  () => props.workspaceRoot,
  () => {
    if (props.autoLoad) void reload();
  },
);
</script>

<style scoped>
.spec-list-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px;
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.spec-list-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spec-list-panel__title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}
.spec-list-panel__count {
  font-size: 11px;
  color: var(--ink-3);
}
.spec-list-panel__reload {
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink);
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
}
.spec-list-panel__hint,
.spec-list-panel__error {
  font-size: 12px;
  color: var(--ink-3);
}
.spec-list-panel__init {
  margin-left: 8px;
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: 4px;
  color: var(--ink);
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}
.spec-list-panel__error {
  color: var(--error);
}
.spec-list-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
}
.spec-list-panel__item {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--ink-2);
}
.spec-list-panel__item:hover {
  background: var(--bg-2);
  color: var(--ink);
}
.spec-list-panel__item--active {
  background: var(--accent);
  color: #fff;
}
.spec-list-panel__id {
  font-family: inherit;
}
</style>
