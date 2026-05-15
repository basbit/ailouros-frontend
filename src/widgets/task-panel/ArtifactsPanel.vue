<template>
  <details
    class="panel panel--artifacts content-panel--artifacts"
    :open="open"
    @toggle="onToggle"
  >
    <summary class="panel-header">
      <span class="panel-title">{{ t("page.artifacts") }}</span>
    </summary>
    <div class="panel-body">
      <a v-if="artifactPath" :href="artifactPath" target="_blank" rel="noreferrer">
        {{ artifactPath }}
      </a>
      <span v-else>—</span>
      <div class="hint" style="margin-top: 8px">
        {{ t("page.runLogHint") }}
      </div>
      <div v-if="clarifyCacheProvenance" class="hint" style="margin-top: 10px">
        <strong>{{ t("page.clarifyCache") }}:</strong>
        {{ clarifyCacheProvenance }}
      </div>
      <div
        v-if="workspaceIdentityResolved"
        class="hint"
        style="margin-top: 6px; word-break: break-all"
      >
        <strong>{{ t("page.workspaceIdentity") }}:</strong>
        {{ workspaceIdentityResolved }}
      </div>
      <VisualArtifactsPanel :manifest="visualProbeManifest" />
      <ScenarioArtifactsPanel
        :task-id="taskId"
        :scenario-id="taskScenarioId"
        :task-status="taskStatus"
      />
      <ScenarioQualityChecksPanel
        :task-id="taskId"
        :scenario-id="taskScenarioId"
        :task-status="taskStatus"
      />
      <ScenarioSourcesPanel :raw-agent-text="researchSourcesText" />
      <ScenarioFindingsPanel :raw-agent-text="codeReviewFindingsText" />
      <ScenarioScreenshotGalleryPanel :visual-manifest="visualProbeManifest" />
    </div>
  </details>
</template>

<script setup lang="ts">
import VisualArtifactsPanel from "@/widgets/task-panel/VisualArtifactsPanel.vue";
import ScenarioArtifactsPanel from "@/widgets/task-panel/ScenarioArtifactsPanel.vue";
import ScenarioQualityChecksPanel from "@/widgets/task-panel/ScenarioQualityChecksPanel.vue";
import ScenarioSourcesPanel from "@/widgets/task-panel/ScenarioSourcesPanel.vue";
import ScenarioFindingsPanel from "@/widgets/task-panel/ScenarioFindingsPanel.vue";
import ScenarioScreenshotGalleryPanel from "@/widgets/task-panel/ScenarioScreenshotGalleryPanel.vue";
import { useI18n } from "@/shared/lib/i18n";
import type { TaskStatus } from "@/shared/model/task-types";

defineProps<{
  open: boolean;
  artifactPath: string | null;
  clarifyCacheProvenance: string;
  workspaceIdentityResolved: string;
  visualProbeManifest: Record<string, unknown> | null;
  taskId: string | null;
  taskScenarioId: string | null;
  taskStatus: TaskStatus | null;
  researchSourcesText: string;
  codeReviewFindingsText: string;
}>();

const emit = defineEmits<{
  (e: "toggle", event: Event): void;
}>();

function onToggle(event: Event): void {
  emit("toggle", event);
}

const { t } = useI18n();
</script>
