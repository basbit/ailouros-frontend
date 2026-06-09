<template>
  <section class="first-run-llm-paths">
    <h3 class="first-run-llm-paths__title">
      {{ t("firstRun.llmPaths.title") }}
    </h3>
    <div class="first-run-llm-paths__list">
      <button
        type="button"
        class="first-run-llm-path"
        :class="{
          'first-run-llm-path--recommended':
            recommendedPath === 'download-default-gguf',
        }"
        :disabled="!canSkipModel"
        @click="emit('pickDownloadDefault')"
      >
        <strong>{{ t("firstRun.llmPaths.downloadDefault.title") }}</strong>
        <span>{{ t("firstRun.llmPaths.downloadDefault.detail") }}</span>
      </button>
      <button
        type="button"
        class="first-run-llm-path"
        :class="{
          'first-run-llm-path--recommended': recommendedPath === 'use-local-server',
        }"
        :disabled="!hasDetectedLocalServer"
        @click="emit('pickLocalServer')"
      >
        <strong>{{ t("firstRun.llmPaths.localServer.title") }}</strong>
        <span v-if="hasDetectedLocalServer">{{ detectedLocalServerLabel }}</span>
        <span v-else>{{ t("firstRun.llmPaths.localServer.notDetected") }}</span>
      </button>
      <button type="button" class="first-run-llm-path" @click="emit('pickCloud')">
        <strong>{{ t("firstRun.llmPaths.cloud.title") }}</strong>
        <span>{{ t("firstRun.llmPaths.cloud.detail") }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  recommendedPath: string | null;
  canSkipModel: boolean;
  hasDetectedLocalServer: boolean;
  detectedLocalServerLabel: string;
}>();

const emit = defineEmits<{
  pickDownloadDefault: [];
  pickLocalServer: [];
  pickCloud: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.first-run-llm-paths {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.first-run-llm-paths__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}
.first-run-llm-paths__list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.4rem;
}
.first-run-llm-path {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border-subtle, #d4d4d8);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 0.85rem;
  color: var(--text, #111);
}
.first-run-llm-path strong {
  font-weight: 600;
}
.first-run-llm-path span {
  color: var(--text-muted, #666);
}
.first-run-llm-path:hover:not(:disabled) {
  border-color: #1d4ed8;
}
.first-run-llm-path:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.first-run-llm-path--recommended {
  border-color: #1d4ed8;
  background: rgba(29, 78, 216, 0.06);
}
</style>
