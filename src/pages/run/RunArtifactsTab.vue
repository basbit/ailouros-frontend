<template>
  <section class="run-artifacts">
    <div v-if="!hasContent" class="run-artifacts__empty">
      <h3 class="run-artifacts__empty-title">
        {{ t("runLive.artifacts.empty.title") }}
      </h3>
      <p class="run-artifacts__empty-hint">
        {{ t("runLive.artifacts.empty.hint") }}
      </p>
    </div>
    <div v-else class="run-artifacts__stack">
      <StreamingRagCard v-if="!isHistory && rag.visible.value" />
      <InlineCitationList v-if="!isHistory && citations.visible.value" />
      <PeerReviewReportPanel
        :report="peerReview.report.value"
        :loading="peerReview.loading.value"
        :error="peerReview.error.value"
        @inspect-file="onInspectFile"
        @retry="peerReview.refresh"
      />
      <ArtefactBrowser
        :scenario="currentScenario"
        :workspace-root="currentWorkspaceRoot"
      />
      <ArtefactEditorModal
        :visible="isEditorOpen"
        :task-id="effectiveTaskId"
        :file-path="inspectFilePath ?? ''"
        @close="isEditorOpen = false"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import StreamingRagCard from "@/widgets/streaming-rag-card/StreamingRagCard.vue";
import InlineCitationList from "@/widgets/inline-citation-list/InlineCitationList.vue";
import ArtefactBrowser from "@/widgets/artefact-browser/ArtefactBrowser.vue";
import ArtefactEditorModal from "@/features/artifact-editor/ArtefactEditorModal.vue";
import PeerReviewReportPanel from "@/features/peer-review-display/PeerReviewReportPanel.vue";
import { usePeerReview } from "@/features/peer-review-display/usePeerReview";
import { useStreamingRagCard } from "@/features/streaming-rag/useStreamingRagCard";
import { useInlineCitations } from "@/features/inline-citations/useInlineCitations";
import { useUiStore } from "@/shared/store/ui";

const props = withDefaults(
  defineProps<{
    taskId?: string | null;
    workspaceRoot?: string | null;
    scenario?: string | null;
    isHistory?: boolean;
  }>(),
  {
    taskId: null,
    workspaceRoot: null,
    scenario: null,
    isHistory: false,
  },
);

const { t } = useI18n();
const rag = useStreamingRagCard();
const citations = useInlineCitations();
const ui = useUiStore();

const effectiveTaskId = computed(() => props.taskId ?? ui.taskId);
const peerReview = usePeerReview(() => effectiveTaskId.value);

const inspectFilePath = ref<string | null>(null);
const isEditorOpen = ref(false);

watch(
  () => ui.taskStatus,
  () => {
    void peerReview.refresh();
  },
);

function onInspectFile(payload: { path: string; line: number }): void {
  inspectFilePath.value = payload.path;
  isEditorOpen.value = true;
}

const currentScenario = computed(
  () => props.scenario ?? ui.taskScenarioId ?? "default",
);
const currentWorkspaceRoot = computed(() => {
  if (props.workspaceRoot) return props.workspaceRoot;
  const entry = ui.historyList.find((item) => item.taskId === effectiveTaskId.value);
  return entry?.workspace_root ?? null;
});

const hasContent = computed(
  () =>
    (!props.isHistory && (rag.visible.value || citations.visible.value)) ||
    Boolean(peerReview.report.value) ||
    Boolean(effectiveTaskId.value),
);
</script>

<style scoped>
.run-artifacts {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
  padding: 16px 0;
}

.run-artifacts__empty {
  margin: auto;
  text-align: center;
  max-width: 480px;
  padding: 48px 16px;
}

.run-artifacts__empty-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 400;
  color: var(--ink);
  margin: 0 0 8px;
}

.run-artifacts__empty-hint {
  font-size: 13px;
  color: var(--ink-3);
  margin: 0;
  line-height: 1.5;
}

.run-artifacts__stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
