<template>
  <AppHeader
    :task-id="header.taskId.value"
    :is-running="header.isRunning.value"
    :project-name="header.projectName.value"
    :current-project-id="header.currentProjectId.value"
    :project-list="header.projectList.value"
    @open-system-health="systemHealthOpen = true"
    @close-task="header.closeLoadedTask"
    @open-report-problem="openReportProblem"
    @resume-run="onResumeRun"
    @project-change="header.projectForm.onProjectChange"
    @project-new="header.projectForm.onNewProject"
    @project-rename="header.projectForm.onRenameProjectById"
    @project-delete="header.projectForm.onDeleteProjectById"
    @project-edit="header.projectForm.onEditProjectById"
  />
  <ReportProblemDialog
    :open="reportProblemOpen"
    repo-slug="basbit/ailouros"
    :task-id="ui.taskId"
    :scenario-id="ui.taskScenarioId"
    :scenario-title="ui.taskScenarioTitle"
    :task-status="ui.taskStatus ?? null"
    :error-text="ui.taskError ? String(ui.taskError) : null"
    :recent-log="reportRecentLog"
    :artifact-paths="reportArtifactPaths"
    @close="closeReportProblem"
  />
  <ProjectFormDialog
    :open="header.projectForm.projectFormOpen.value"
    :mode="header.projectForm.projectFormMode.value"
    :initial="header.projectForm.projectFormInitial.value"
    :capabilities="ui.capabilities"
    @update:open="header.projectForm.projectFormOpen.value = $event"
    @submit="header.projectForm.onProjectFormSubmit"
  />
  <Teleport to="body">
    <div
      v-if="systemHealthOpen"
      class="system-health-modal__backdrop"
      role="presentation"
      @click.self="systemHealthOpen = false"
    >
      <div class="system-health-modal__dialog" role="dialog" aria-modal="true">
        <button
          type="button"
          class="system-health-modal__close"
          :aria-label="t('settingsDrawer.close')"
          @click="systemHealthOpen = false"
        >
          ×
        </button>
        <SystemHealthPanel />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppHeader from "./AppHeader.vue";
import ProjectFormDialog from "@/features/project-settings/ProjectFormDialog.vue";
import ReportProblemDialog from "@/features/report-a-problem/ReportProblemDialog.vue";
import { useReportProblem } from "@/features/report-a-problem/useReportProblem";
import SystemHealthPanel from "@/features/system-health/SystemHealthPanel.vue";
import { useAppHeaderBindings } from "./useAppHeaderBindings";
import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";

const ui = useUiStore();
const header = useAppHeaderBindings();
const { t } = useI18n();
const {
  reportProblemOpen,
  reportRecentLog,
  reportArtifactPaths,
  openReportProblem,
  closeReportProblem,
} = useReportProblem();

const systemHealthOpen = ref(false);
const router = useRouter();

function onResumeRun(): void {
  void router.push("/run/active");
}
</script>

<style scoped>
.system-health-modal__backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.system-health-modal__dialog {
  position: relative;
  width: min(640px, 100%);
  max-height: 80vh;
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lg);
  padding: 14px 18px 18px;
  overflow-y: auto;
}

.system-health-modal__close {
  position: absolute;
  top: 10px;
  right: 12px;
  appearance: none;
  background: transparent;
  border: none;
  font-size: 18px;
  line-height: 1;
  color: var(--ink-4);
  cursor: pointer;
}

.system-health-modal__close:hover {
  color: var(--ink);
}
</style>
