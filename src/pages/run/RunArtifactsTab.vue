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
      <StreamingRagCard v-if="rag.visible.value" />
      <InlineCitationList v-if="citations.visible.value" />
      <ArtefactBrowser
        :scenario="currentScenario"
        :workspace-root="currentWorkspaceRoot"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import StreamingRagCard from "@/widgets/streaming-rag-card/StreamingRagCard.vue";
import InlineCitationList from "@/widgets/inline-citation-list/InlineCitationList.vue";
import ArtefactBrowser from "@/widgets/artefact-browser/ArtefactBrowser.vue";
import { useStreamingRagCard } from "@/features/streaming-rag/useStreamingRagCard";
import { useInlineCitations } from "@/features/inline-citations/useInlineCitations";
import { useUiStore } from "@/shared/store/ui";

const { t } = useI18n();
const rag = useStreamingRagCard();
const citations = useInlineCitations();
const ui = useUiStore();

const currentScenario = computed(() => ui.taskScenarioId ?? "default");
const currentWorkspaceRoot = computed(() => {
  const entry = ui.historyList.find((item) => item.taskId === ui.taskId);
  return entry?.workspace_root ?? null;
});

const hasContent = computed(
  () => rag.visible.value || citations.visible.value || Boolean(ui.taskId),
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
