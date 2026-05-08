<template>
  <div v-if="open" class="report-dialog" @click.self="emit('close')">
    <div class="report-dialog__panel" role="dialog">
      <header class="report-dialog__head">
        <span class="report-dialog__title">{{ t("reportProblem.title") }}</span>
        <button type="button" class="report-dialog__close" @click="emit('close')">
          ×
        </button>
      </header>
      <p class="report-dialog__banner">{{ t("reportProblem.redactedBanner") }}</p>
      <label class="report-dialog__row">
        <input
          type="checkbox"
          :checked="includeArtifacts"
          @change="onToggleArtifacts($event)"
        />
        <span>{{ t("reportProblem.includeArtifacts") }}</span>
      </label>
      <pre class="report-dialog__preview"
        >{{ draft.title }}

{{ draft.body }}</pre
      >
      <footer class="report-dialog__foot">
        <a
          v-if="issueUrl"
          class="report-dialog__primary"
          :href="issueUrl"
          target="_blank"
          rel="noreferrer"
          >{{ t("reportProblem.openOnGithub") }}</a
        >
        <button type="button" class="report-dialog__copy" @click="onCopy">
          {{ t("reportProblem.copyMarkdown") }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { buildIssueDraft, buildIssueUrl } from "./buildIssueUrl";

const props = defineProps<{
  open: boolean;
  repoSlug: string;
  taskId: string | null;
  scenarioId: string | null;
  scenarioTitle: string | null;
  taskStatus: string | null;
  errorText: string | null;
  recentLog: string | null;
  artifactPaths: string[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const includeArtifacts = ref(true);

function effectiveOptions() {
  return {
    repoSlug: props.repoSlug,
    taskId: props.taskId,
    scenarioId: props.scenarioId,
    scenarioTitle: props.scenarioTitle,
    taskStatus: props.taskStatus,
    errorText: props.errorText,
    recentLog: props.recentLog,
    artifactPaths: includeArtifacts.value ? props.artifactPaths : [],
  };
}

const draft = computed(() => buildIssueDraft(effectiveOptions()));
const issueUrl = computed(() => buildIssueUrl(effectiveOptions()));

function onToggleArtifacts(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  includeArtifacts.value = target?.checked ?? true;
}

async function onCopy(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(
      `# ${draft.value.title}\n\n${draft.value.body}`,
    );
  } catch {
    /* ignore clipboard error */
  }
}
</script>

<style scoped>
.report-dialog {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 60px;
  z-index: 1000;
}
.report-dialog__panel {
  width: min(640px, 92vw);
  max-height: 80vh;
  background: var(--surface, #1a1d29);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.report-dialog__head {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.report-dialog__title {
  font-size: 13px;
  font-weight: 700;
}
.report-dialog__close {
  background: transparent;
  border: none;
  color: var(--text2, #a8b0c4);
  font-size: 18px;
  cursor: pointer;
}
.report-dialog__banner {
  margin: 8px 12px 0;
  padding: 6px 8px;
  background: color-mix(in srgb, #d99f24 18%, transparent);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text, #f5f0e7);
}
.report-dialog__row {
  margin: 8px 12px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text2, #a8b0c4);
}
.report-dialog__preview {
  flex: 1;
  margin: 0 12px 12px;
  padding: 8px 10px;
  font-size: 11px;
  background: var(--surface2, #14171f);
  border-radius: 6px;
  overflow: auto;
  white-space: pre-wrap;
  font-family: var(--mono, ui-monospace, monospace);
}
.report-dialog__foot {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border, #2a2f3e);
}
.report-dialog__primary {
  background: var(--accent, #3b5bdb);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  text-decoration: none;
}
.report-dialog__copy {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  color: var(--text, #f5f0e7);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}
</style>
