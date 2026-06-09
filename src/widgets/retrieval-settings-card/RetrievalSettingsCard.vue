<template>
  <section class="retrieval-settings" :aria-label="t('retrievalSettings.cardAria')">
    <header class="retrieval-settings__header">
      <h3 class="retrieval-settings__title">
        {{ t("retrievalSettings.headline") }}
      </h3>
      <button
        type="button"
        class="retrieval-settings__btn"
        :disabled="store.loading.value"
        @click="store.refresh"
      >
        {{
          store.loading.value
            ? t("retrievalSettings.refreshing")
            : t("retrievalSettings.refresh")
        }}
      </button>
    </header>

    <p v-if="store.lastError.value" class="retrieval-settings__error">
      {{ store.lastError.value }}
    </p>

    <p v-if="!settings && !store.loading.value" class="retrieval-settings__hint">
      {{ t("retrievalSettings.empty") }}
    </p>

    <div v-if="settings" class="retrieval-settings__body">
      <section class="retrieval-settings__group">
        <h4 class="retrieval-settings__subtitle">
          {{ t("retrievalSettings.lateChunkingHeading") }}
        </h4>
        <p class="retrieval-settings__meta">
          <span
            class="retrieval-settings__pill"
            :class="
              settings.lateChunkingEnabled
                ? 'retrieval-settings__pill--on'
                : 'retrieval-settings__pill--off'
            "
          >
            {{
              settings.lateChunkingEnabled
                ? t("retrievalSettings.enabled")
                : t("retrievalSettings.disabled")
            }}
          </span>
          <span v-if="settings.lateChunkingModelId" class="retrieval-settings__model">
            {{ settings.lateChunkingModelId }}
          </span>
        </p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useRetrievalSettings } from "@/features/retrieval-settings/useRetrievalSettings";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const store = useRetrievalSettings();
const settings = computed(() => store.settings.value);

onMounted(() => {
  if (!settings.value) {
    void store.refresh();
  }
});
</script>

<style scoped>
.retrieval-settings {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retrieval-settings__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.retrieval-settings__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.retrieval-settings__btn {
  appearance: none;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.retrieval-settings__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.retrieval-settings__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.retrieval-settings__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.retrieval-settings__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retrieval-settings__subtitle {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin: 0 0 4px;
}

.retrieval-settings__meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.retrieval-settings__model {
  margin: 3px 0 0;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.retrieval-settings__pill {
  padding: 1px 8px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.retrieval-settings__pill--on {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 14%, transparent);
}

.retrieval-settings__pill--off {
  color: var(--ink-3);
  background: color-mix(in srgb, var(--ink-3) 12%, transparent);
}
</style>
