/**
 * useProjectFormActions — project create/edit/rename/delete dialog logic
 * extracted from `SwarmUiPage`. Returns refs the page wires into
 * <ProjectFormDialog/>, plus AppHeader event handlers.
 */

import { ref } from "vue";
import type { Ref } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import type { ProjectFormValues } from "@/features/project-settings/ProjectFormDialog.vue";
import type { useSettings } from "@/widgets/settings/useSettings";

type SettingsApi = ReturnType<typeof useSettings>;

const ADVANCED_FORM_FIELDS = [
  "workspace_root",
  "project_context_file",
  "workspace_write",
  "swarm_languages",
  "swarm_doc_locale",
  "swarm_documentation_sources",
  "swarm_pattern_memory",
  "swarm_memory_namespace",
  "swarm_pattern_memory_path",
  "swarm_pipeline_hooks_module",
  "swarm_disable_tree_sitter",
  "swarm_mcp_auto",
  "swarm_skip_mcp_tools",
  "mcp_servers_json",
  "swarm_database_url",
  "swarm_database_hint",
  "swarm_database_readonly",
  "swarm_visual_probe_enabled",
  "swarm_visual_base_url",
  "swarm_visual_start_command",
  "swarm_visual_start_directory",
  "swarm_visual_ready_path",
  "swarm_visual_pages",
  "swarm_visual_capture_har",
  "swarm_visual_capture_trace",
  "swarm_visual_multimodal_review",
  "swarm_visual_max_review_images",
  "media_enabled",
  "media_image_provider",
  "media_image_model",
  "media_image_api_key",
  "media_audio_provider",
  "media_audio_model",
  "media_audio_api_key",
  "media_audio_voice",
  "media_budget_max_cost_usd",
  "media_budget_max_attempts",
  "media_license_policy",
] as const;

export interface ProjectFormActions {
  projectFormOpen: Ref<boolean>;
  projectFormMode: Ref<"create" | "edit">;
  projectFormInitial: Ref<Partial<ProjectFormValues>>;
  onNewProject: () => void;
  onEditProjectById: (id: string) => void;
  onRenameProjectById: (id: string) => Promise<void>;
  onDeleteProjectById: (id: string) => Promise<void>;
  onProjectFormSubmit: (values: ProjectFormValues) => Promise<void>;
  onProjectChange: (id: string) => Promise<void>;
  refreshProjectPanels: () => void;
}

export function useProjectFormActions(
  settings: SettingsApi,
  options: {
    syncTaskFromServer: (taskId: string) => Promise<unknown>;
    sendWsSubscribe: () => void;
  },
): ProjectFormActions {
  const projectsStore = useProjectsStore();
  const ui = useUiStore();
  const taskStore = useTaskStore();
  const ux = useUxStore();
  const { t } = useI18n();

  const projectFormOpen = ref(false);
  const projectFormMode = ref<"create" | "edit">("create");
  const projectFormEditingId = ref<string | null>(null);
  const projectFormInitial = ref<Partial<ProjectFormValues>>({});

  function buildFormInitial(snap: Record<string, unknown>): Partial<ProjectFormValues> {
    const out: Record<string, unknown> = {};
    for (const k of ADVANCED_FORM_FIELDS) {
      if (k in snap) out[k] = snap[k];
    }
    return out as Partial<ProjectFormValues>;
  }

  function applyAdvancedToForm(values: ProjectFormValues): void {
    for (const k of ADVANCED_FORM_FIELDS) {
      (settings.form as Record<string, unknown>)[k] = (
        values as unknown as Record<string, unknown>
      )[k];
    }
  }

  function advancedPatch(values: ProjectFormValues): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const k of ADVANCED_FORM_FIELDS) {
      out[k] = (values as unknown as Record<string, unknown>)[k];
    }
    return out;
  }

  function refreshProjectPanels(): void {
    ui.loadEventsView(projectsStore.currentId);
    ui.loadHistory(projectsStore.currentId);
    ui.resetTaskView();
    const tid = ui.restoreActiveTask(projectsStore.currentId);
    ui.taskId = tid;
    taskStore.resetTask();
    if (tid) {
      taskStore.setTaskId(tid);
      void options.syncTaskFromServer(tid);
    }
    options.sendWsSubscribe();
  }

  async function onProjectChange(id: string): Promise<void> {
    if (id === projectsStore.currentId) return;
    await settings.switchProject(id);
    refreshProjectPanels();
  }

  function onNewProject(): void {
    projectFormMode.value = "create";
    projectFormEditingId.value = null;
    projectFormInitial.value = {
      name: t("page.newProjectDefault"),
      workspace_root: "",
      project_context_file: "",
      workspace_write: false,
    };
    projectFormOpen.value = true;
  }

  function onEditProjectById(id: string): void {
    const snap = projectsStore.getSnap(id);
    const entry = projectsStore.data?.projects[id];
    if (!snap || !entry) return;
    projectFormMode.value = "edit";
    projectFormEditingId.value = id;
    projectFormInitial.value = {
      name: entry.name,
      ...buildFormInitial(snap as unknown as Record<string, unknown>),
    };
    projectFormOpen.value = true;
  }

  async function onProjectFormSubmit(values: ProjectFormValues): Promise<void> {
    projectFormOpen.value = false;

    if (projectFormMode.value === "create") {
      await settings.newProject(values.name);
      applyAdvancedToForm(values);
      settings.saveSettingsSoon();
      refreshProjectPanels();
      return;
    }

    const id = projectFormEditingId.value;
    if (!id) return;
    projectsStore.renameProject(id, values.name);

    if (id === projectsStore.currentId) {
      applyAdvancedToForm(values);
      settings.saveSettingsSoon();
    } else {
      projectsStore.patchSnap(id, advancedPatch(values));
    }
  }

  async function onRenameProjectById(id: string): Promise<void> {
    const pdata = projectsStore.data;
    if (!pdata) return;
    const p = pdata.projects[id];
    const name = (
      (await ux.promptDialog({
        title: t("dialogs.project.rename.title"),
        message: t("dialogs.project.rename.message"),
        value: p?.name || id,
      })) ?? ""
    ).trim();
    if (!name) return;
    projectsStore.renameProject(id, name);
  }

  async function onDeleteProjectById(id: string): Promise<void> {
    const pdata = projectsStore.data;
    if (!pdata) return;
    const ids = Object.keys(pdata.projects);
    if (ids.length <= 1) {
      await ux.alertDialog({
        title: t("dialogs.project.last.title"),
        message: t("dialogs.project.last.message"),
      });
      return;
    }
    const label = pdata.projects[id]?.name || id;
    const confirmed = await ux.confirmDialog({
      title: t("dialogs.project.delete.title"),
      message: `${t("dialogs.project.delete.message")}\n\n${label}`,
    });
    if (!confirmed) return;
    if (id === pdata.current) {
      await settings.deleteCurrentProject();
      refreshProjectPanels();
    } else {
      projectsStore.deleteProject(id);
    }
  }

  return {
    projectFormOpen,
    projectFormMode,
    projectFormInitial,
    onNewProject,
    onEditProjectById,
    onRenameProjectById,
    onDeleteProjectById,
    onProjectFormSubmit,
    onProjectChange,
    refreshProjectPanels,
  };
}
