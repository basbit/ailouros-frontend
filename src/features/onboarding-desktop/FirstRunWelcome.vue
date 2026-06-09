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

        <FirstRunStageList :stages="state.stages.value" />

        <FirstRunLlmPaths
          :recommended-path="state.recommendedPath.value"
          :can-skip-model="canSkipModel"
          :has-detected-local-server="hasDetectedLocalServer"
          :detected-local-server-label="detectedLocalServerLabel"
          @pick-download-default="onPickDownloadDefault"
          @pick-local-server="onPickLocalServer"
          @pick-cloud="onPickCloud"
        />

        <p v-if="state.error.value" class="first-run-card__error">
          {{ state.error.value }}
        </p>

        <section
          v-if="state.backendFailureMessage.value"
          class="first-run-card__failure"
          role="alert"
        >
          <h3>{{ t("firstRun.backendFailed.title") }}</h3>
          <p>{{ state.backendFailureMessage.value }}</p>
          <div class="first-run-card__failure-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="state.retryBootstrap()"
            >
              {{ t("firstRun.backendFailed.retry") }}
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              @click="state.revealLogsFolder()"
            >
              {{ t("firstRun.backendFailed.openLogsFolder") }}
            </button>
          </div>
          <details
            v-if="state.desktopLogTail.value"
            class="first-run-card__failure-details"
          >
            <summary>{{ t("firstRun.backendFailed.showLog") }}</summary>
            <pre>{{ state.desktopLogTail.value }}</pre>
          </details>
        </section>

        <section v-if="showOllamaHint" class="first-run-card__hint" role="note">
          <h3>{{ t("firstRun.ollamaHint.title") }}</h3>
          <p>{{ ollamaProbe?.hint || t("firstRun.ollamaHint.body") }}</p>
          <code v-if="showOllamaOriginsCommand" class="first-run-card__hint-cmd">{{
            ollamaOriginsCommand
          }}</code>
        </section>

        <section v-if="showLmStudioHint" class="first-run-card__hint" role="note">
          <h3>LM Studio</h3>
          <p>{{ lmStudioProbe?.hint }}</p>
        </section>

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
import { useFirstRun } from "./useFirstRun";
import FirstRunStageList from "./FirstRunStageList.vue";
import FirstRunLlmPaths from "./FirstRunLlmPaths.vue";

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

const ollamaProbe = computed(
  () => state.localProviderProbes.value.find((p) => p.provider === "ollama") ?? null,
);

const lmStudioProbe = computed(
  () => state.localProviderProbes.value.find((p) => p.provider === "lm_studio") ?? null,
);

const showOllamaHint = computed(() => {
  const probe = ollamaProbe.value;
  if (!probe) return false;
  return probe.status === "rejected" || probe.status === "not_running";
});

const showLmStudioHint = computed(() => {
  const probe = lmStudioProbe.value;
  if (!probe) return false;
  return probe.status === "rejected" || probe.status === "malformed";
});

const ollamaOriginsCommand =
  'OLLAMA_ORIGINS="tauri://localhost,http://tauri.localhost,*" ollama serve';

const showOllamaOriginsCommand = computed(
  () => ollamaProbe.value?.status === "rejected",
);

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
.first-run-card__error {
  background: #fef2f2;
  color: #991b1b;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin: 0;
  font-size: 0.85rem;
}
.first-run-card__failure {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
}
.first-run-card__failure h3 {
  margin: 0 0 0.3rem;
  font-size: 0.9rem;
}
.first-run-card__failure pre {
  margin-top: 0.4rem;
  background: #1f2937;
  color: #e5e7eb;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.72rem;
  max-height: 16rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
.first-run-card__failure-details summary {
  cursor: pointer;
  color: #b91c1c;
}
.first-run-card__failure-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.first-run-card__hint {
  background: rgba(29, 78, 216, 0.06);
  border: 1px solid rgba(29, 78, 216, 0.2);
  color: var(--text, #111);
  border-radius: 6px;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
}
.first-run-card__hint h3 {
  margin: 0 0 0.3rem;
  font-size: 0.9rem;
}
.first-run-card__hint-cmd {
  display: block;
  margin-top: 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.4rem 0.55rem;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
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
