<template>
  <section class="index-status" :aria-label="t('indexStatus.cardAria')">
    <header class="index-status__header">
      <h3 class="index-status__title">{{ t("indexStatus.headline") }}</h3>
      <button
        type="button"
        class="index-status__btn"
        :disabled="loading || !workspaceRoot.trim()"
        @click="refresh"
      >
        {{ loading ? t("indexStatus.refreshing") : t("indexStatus.refresh") }}
      </button>
    </header>

    <p v-if="!workspaceRoot.trim()" class="index-status__hint">
      {{ t("indexStatus.noWorkspace") }}
    </p>

    <p v-else-if="lastError" class="index-status__error">{{ lastError }}</p>

    <p v-else-if="!status && !loading" class="index-status__hint">
      {{ t("indexStatus.empty") }}
    </p>

    <div v-else-if="status" class="index-status__body">
      <p class="index-status__meta">
        <span
          :class="[
            'index-status__pill',
            status.wiki.exists ? 'index-status__pill--on' : 'index-status__pill--off',
          ]"
        >
          {{ status.wiki.exists ? t("indexStatus.indexed") : t("indexStatus.noIndex") }}
        </span>
        <span>{{ t("indexStatus.backend") }}: {{ status.vectorBackend }}</span>
        <span v-if="status.points > 0">
          {{ t("indexStatus.points") }}: {{ status.points }}
        </span>
      </p>
      <p v-if="status.wiki.wikiFiles > 0" class="index-status__model">
        {{ t("indexStatus.wikiFiles") }}: {{ status.wiki.wikiFiles }} ·
        {{ t("indexStatus.chunks") }}:
        {{ status.wiki.wikiChunks }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useIndexStatus } from "@/features/index-status/useIndexStatus";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ workspaceRoot: string }>();

const { t } = useI18n();
const store = useIndexStatus();

const status = computed(() => store.status.value);
const loading = computed(() => store.loading.value);
const lastError = computed(() => store.lastError.value);

function refresh(): void {
  void store.refresh(props.workspaceRoot);
}

onMounted(() => {
  if (props.workspaceRoot.trim()) {
    void store.refresh(props.workspaceRoot);
  }
});
</script>

<style scoped>
.index-status {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.index-status__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.index-status__title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.index-status__btn {
  appearance: none;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 3px 9px;
  font-size: 12px;
  cursor: pointer;
}

.index-status__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.index-status__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.index-status__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.index-status__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.index-status__meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.index-status__model {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.index-status__pill {
  padding: 1px 8px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.index-status__pill--on {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 14%, transparent);
}

.index-status__pill--off {
  color: var(--ink-3);
  background: color-mix(in srgb, var(--ink-3) 12%, transparent);
}
</style>
