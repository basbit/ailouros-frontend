<template>
  <ProjectFormDialog
    :open="projectFormOpen"
    :mode="projectFormMode"
    :initial="projectFormInitial"
    :capabilities="capabilities"
    @update:open="(val) => emit('update:projectFormOpen', val)"
    @submit="(values) => emit('project-form-submit', values)"
  />

  <SettingsDrawer
    :open="settingsDrawerOpen"
    @update:open="(val) => emit('update:settingsDrawerOpen', val)"
  >
    <RemoteApiProfiles
      :profiles="profiles"
      @add="emit('profile-add')"
      @remove="(idx) => emit('profile-remove', idx)"
      @update="(idx, field, val) => emit('profile-update', idx, field, val)"
    />
    <GlobalSettingsPanel
      :remote-api-provider="remoteApiProvider"
      :remote-api-key="remoteApiKey"
      :remote-api-base-url="remoteApiBaseUrl"
    />
    <LocalModels />
  </SettingsDrawer>

  <PromptLibraryPopover
    :open="promptLibraryOpen"
    :entries="promptLibraryEntries"
    @pick="(entry) => emit('prompt-library-pick', entry)"
    @remove="(id) => emit('prompt-library-remove', id)"
    @save-current="emit('prompt-library-save-current')"
    @close="emit('prompt-library-close')"
  />

  <AssetUploadDialog
    :visible="assetUploadOpen"
    :workspace-root="workspaceRoot"
    target-subdir="assets"
    @uploaded="(path) => emit('asset-uploaded', path)"
    @close="emit('asset-upload-close')"
  />

  <ReportProblemDialog
    :open="reportProblemOpen"
    repo-slug="basbit/ailouros"
    :task-id="taskId"
    :scenario-id="taskScenarioId"
    :scenario-title="taskScenarioTitle"
    :task-status="taskStatus ?? null"
    :error-text="taskError ? String(taskError) : null"
    :recent-log="reportRecentLog"
    :artifact-paths="reportArtifactPaths"
    @close="emit('report-problem-close')"
  />

  <SudoPromptDialog
    :visible="sudoPromptOpen"
    :allowed="false"
    :command="manualSudoCommand"
    @confirm="emit('sudo-prompt-confirm')"
    @cancel="emit('sudo-prompt-cancel')"
  />
</template>

<script setup lang="ts">
import ProjectFormDialog, {
  type ProjectFormValues,
} from "@/features/project-settings/ProjectFormDialog.vue";
import SettingsDrawer from "@/widgets/settings-drawer/SettingsDrawer.vue";
import RemoteApiProfiles from "@/features/remote-api/RemoteApiProfiles.vue";
import GlobalSettingsPanel from "@/features/global-settings/GlobalSettingsPanel.vue";
import { LocalModels } from "@/features/local-models";
import PromptLibraryPopover from "@/features/prompt-input/PromptLibraryPopover.vue";
import type { PromptEntry } from "@/features/prompt-input/usePromptLibrary";
import AssetUploadDialog from "@/features/asset-upload/AssetUploadDialog.vue";
import ReportProblemDialog from "@/features/report-a-problem/ReportProblemDialog.vue";
import SudoPromptDialog from "@/features/sudo-prompt/SudoPromptDialog.vue";
import type { TaskStatus } from "@/shared/model/task-types";
import type { RemoteProfileRow } from "@/shared/store/projects";

defineProps<{
  projectFormOpen: boolean;
  projectFormMode: "create" | "edit";
  projectFormInitial: Partial<ProjectFormValues>;
  capabilities: { workspace_write?: boolean; command_exec?: boolean } | null;
  settingsDrawerOpen: boolean;
  profiles: RemoteProfileRow[];
  remoteApiProvider: string;
  remoteApiKey: string;
  remoteApiBaseUrl: string;
  promptLibraryOpen: boolean;
  promptLibraryEntries: PromptEntry[];
  assetUploadOpen: boolean;
  workspaceRoot: string;
  reportProblemOpen: boolean;
  taskId: string | null;
  taskScenarioId: string | null;
  taskScenarioTitle: string | null;
  taskStatus: TaskStatus | null | undefined;
  taskError: unknown;
  reportRecentLog: string;
  reportArtifactPaths: string[];
  sudoPromptOpen: boolean;
  manualSudoCommand: string;
}>();

const emit = defineEmits<{
  (e: "update:projectFormOpen", val: boolean): void;
  (e: "project-form-submit", values: ProjectFormValues): void;
  (e: "update:settingsDrawerOpen", val: boolean): void;
  (e: "profile-add"): void;
  (e: "profile-remove", idx: number): void;
  (e: "profile-update", idx: number, field: keyof RemoteProfileRow, val: string): void;
  (e: "prompt-library-pick", entry: PromptEntry): void;
  (e: "prompt-library-remove", id: string): void;
  (e: "prompt-library-save-current"): void;
  (e: "prompt-library-close"): void;
  (e: "asset-uploaded", path: string): void;
  (e: "asset-upload-close"): void;
  (e: "report-problem-close"): void;
  (e: "sudo-prompt-confirm"): void;
  (e: "sudo-prompt-cancel"): void;
}>();
</script>
