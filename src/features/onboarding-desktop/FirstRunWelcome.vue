<template>
  <Teleport to="body">
    <div
      v-if="state.visible.value"
      class="first-run-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="first-run-card">
        <header class="first-run-card__head">
          <h2>{{ t("firstRun.title") }}</h2>
          <p class="first-run-card__intro">{{ t("firstRun.intro") }}</p>
        </header>

        <ul class="first-run-stages">
          <li
            v-for="entry in state.stages.value"
            :key="entry.stage"
            class="first-run-stage"
            :class="`first-run-stage--${entry.state}`"
          >
            <div class="first-run-stage__head">
              <span class="first-run-stage__icon" aria-hidden="true">{{
                stageIcon(entry.state)
              }}</span>
              <span class="first-run-stage__label">{{
                t(stageLabelKey(entry.stage))
              }}</span>
              <span class="first-run-stage__state">{{
                t(stageStateKey(entry.state))
              }}</span>
            </div>
            <progress
              v-if="entry.state === 'active'"
              :value="entry.fraction"
              max="1"
              class="first-run-stage__progress"
            />
            <p v-if="entry.message" class="first-run-stage__message">
              {{ entry.message }}
            </p>
          </li>
        </ul>

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
                  state.recommendedPath.value === 'download-default-gguf',
              }"
              :disabled="!canSkipModel"
              @click="onPickDownloadDefault"
            >
              <strong>{{ t("firstRun.llmPaths.downloadDefault.title") }}</strong>
              <span>{{ t("firstRun.llmPaths.downloadDefault.detail") }}</span>
            </button>
            <button
              type="button"
              class="first-run-llm-path"
              :class="{
                'first-run-llm-path--recommended':
                  state.recommendedPath.value === 'use-local-server',
              }"
              :disabled="!hasDetectedLocalServer"
              @click="onPickLocalServer"
            >
              <strong>{{ t("firstRun.llmPaths.localServer.title") }}</strong>
              <span v-if="hasDetectedLocalServer">
                {{ detectedLocalServerLabel }}
              </span>
              <span v-else>
                {{ t("firstRun.llmPaths.localServer.notDetected") }}
              </span>
            </button>
            <button type="button" class="first-run-llm-path" @click="onPickCloud">
              <strong>{{ t("firstRun.llmPaths.cloud.title") }}</strong>
              <span>{{ t("firstRun.llmPaths.cloud.detail") }}</span>
            </button>
          </div>
        </section>

        <p v-if="state.error.value" class="first-run-card__error">
          {{ state.error.value }}
        </p>

        <footer class="first-run-card__actions">
          <button
            v-if="canRetryModel"
            type="button"
            class="btn btn-secondary"
            @click="state.retryModelDownload()"
          >
            {{ t("firstRun.retryModel") }}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="!canSkipModel"
            @click="state.skipModel()"
          >
            {{ t("firstRun.skipModel") }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canDismiss"
            @click="state.dismiss()"
          >
            {{ t("firstRun.continue") }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { BootstrapStage, StageRuntimeState } from "./types";
import { useFirstRun } from "./useFirstRun";

const { t } = useI18n();
const state = useFirstRun();

onMounted(() => {
  state.start();
});

onBeforeUnmount(() => {
  state.dispose();
});

const canSkipModel = computed(() => {
  const model = state.stages.value.find((entry) => entry.stage === "downloading-model");
  return model ? model.state === "active" || model.state === "pending" : false;
});

const canRetryModel = computed(() => {
  const model = state.stages.value.find((entry) => entry.stage === "downloading-model");
  return model ? model.state === "skipped" || model.state === "error" : false;
});

const hasDetectedLocalServer = computed(() => {
  const detected = state.detectedProviders.value;
  return !!(detected && (detected.ollama || detected.lmStudio));
});

const detectedLocalServerLabel = computed(() => {
  const detected = state.detectedProviders.value;
  if (!detected) return "";
  const tags: string[] = [];
  if (detected.ollama) tags.push("Ollama");
  if (detected.lmStudio) tags.push("LM Studio");
  return tags.join(" + ");
});

const canDismiss = computed(() => state.ready.value || hasDetectedLocalServer.value);

function onPickDownloadDefault(): void {
  void state.retryModelDownload();
}

function onPickLocalServer(): void {
  if (canSkipModel.value) {
    void state.skipModel();
  }
}

function onPickCloud(): void {
  if (canSkipModel.value) {
    void state.skipModel();
  }
}

const stageLabelMap: Record<BootstrapStage, string> = {
  "preparing-tree": "firstRun.stage.preparingTree",
  "fetching-python": "firstRun.stage.fetchingPython",
  "creating-venv": "firstRun.stage.creatingVenv",
  "installing-backend": "firstRun.stage.installingBackend",
  "staging-llama-cpp": "firstRun.stage.stagingLlamaCpp",
  "staging-mcp-runtimes": "firstRun.stage.stagingMcpRuntimes",
  "downloading-model": "firstRun.stage.downloadingModel",
  ready: "firstRun.stage.ready",
};

function stageLabelKey(stage: BootstrapStage): string {
  return stageLabelMap[stage];
}

function stageStateKey(stateName: StageRuntimeState): string {
  return `firstRun.state.${stateName}`;
}

function stageIcon(stateName: StageRuntimeState): string {
  switch (stateName) {
    case "done":
      return "✓";
    case "skipped":
      return "→";
    case "active":
      return "…";
    case "error":
      return "!";
    default:
      return "·";
  }
}
</script>

<style scoped>
.first-run-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}
.first-run-card {
  background: var(--surface, #fff);
  color: var(--text, #111);
  border-radius: 10px;
  padding: 1.5rem 1.75rem;
  width: 100%;
  max-width: 540px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.first-run-card__head h2 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
}
.first-run-card__intro {
  margin: 0;
  color: var(--text-muted, #555);
  font-size: 0.9rem;
}
.first-run-stages {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.first-run-stage {
  border: 1px solid var(--border-subtle, #e0e0e0);
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
}
.first-run-stage__head {
  display: grid;
  grid-template-columns: 1.25rem 1fr auto;
  gap: 0.5rem;
  align-items: center;
}
.first-run-stage__icon {
  font-weight: 600;
  text-align: center;
}
.first-run-stage__label {
  font-weight: 500;
}
.first-run-stage__state {
  font-size: 0.8rem;
  color: var(--text-muted, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.first-run-stage--done .first-run-stage__icon {
  color: #166534;
}
.first-run-stage--skipped .first-run-stage__icon {
  color: #b45309;
}
.first-run-stage--active .first-run-stage__icon {
  color: #1d4ed8;
}
.first-run-stage--error .first-run-stage__icon {
  color: #b91c1c;
}
.first-run-stage__progress {
  width: 100%;
  height: 4px;
  margin-top: 0.4rem;
}
.first-run-stage__message {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted, #666);
}
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
.first-run-card__error {
  background: #fef2f2;
  color: #991b1b;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin: 0;
  font-size: 0.85rem;
}
.first-run-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.btn {
  padding: 0.45rem 0.95rem;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-primary {
  background: #1d4ed8;
  color: #fff;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  background: transparent;
  border-color: var(--border-subtle, #d4d4d8);
  color: var(--text, #111);
}
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
