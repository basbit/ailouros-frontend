<template>
  <UpdateBanner />
  <SwarmUiPage v-if="activeView === 'main'" />
  <AgentEditorPage v-else-if="activeView === 'agent-editor'" />
  <PluginsPage v-else-if="activeView === 'plugins'" />
  <AppDialogHost />
  <AppToastStack />
</template>

<script setup lang="ts">
import { ref, provide, defineAsyncComponent } from "vue";
import { useSwarmDefaults } from "@/shared/lib/use-swarm-defaults";
import { LS_PROJECTS, LS_SETTINGS } from "@/shared/lib/swarm-ui-constants";
import AppDialogHost from "@/widgets/feedback/AppDialogHost.vue";
import AppToastStack from "@/widgets/feedback/AppToastStack.vue";
import UpdateBanner from "@/widgets/update-banner/UpdateBanner.vue";

// §20.5.3 — Code-split the main page (1500+ LOC + many heavy widgets)
// off the initial bundle so the app shell renders fast; the chunk loads
// while UpdateBanner / dialogs hydrate.
const SwarmUiPage = defineAsyncComponent(
  () => import("@/pages/swarm-ui/SwarmUiPage.vue"),
);

// Lazy-load the Agent Editor — its @vue-flow/* dependencies are large and
// only needed when the editor view is first opened.
const AgentEditorPage = defineAsyncComponent(
  () => import("@/pages/agent-editor/AgentEditorPage.vue"),
);

const PluginsPage = defineAsyncComponent(
  () => import("@/pages/plugins/PluginsPage.vue"),
);

useSwarmDefaults();

const activeView = ref<"main" | "agent-editor" | "plugins">("main");

// Initialise from the cached project snapshot so WikiGraphPanel has the
// workspace root immediately after mount. LS_SETTINGS remains only as a
// legacy migration fallback for pre-project-cache installs.
function _readStoredWorkspaceRoot(): string {
  try {
    const projectsRaw = localStorage.getItem(LS_PROJECTS);
    if (projectsRaw) {
      const parsed = JSON.parse(projectsRaw) as {
        current?: string;
        projects?: Record<string, { snap?: { workspace_root?: string } }>;
      };
      const currentId = parsed.current ?? "";
      const projectRoot =
        parsed.projects?.[currentId]?.snap?.workspace_root?.trim() ?? "";
      if (projectRoot) return projectRoot;
    }
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return "";
    return (
      (JSON.parse(raw) as { workspace_root?: string }).workspace_root?.trim() ?? ""
    );
  } catch {
    return "";
  }
}

const workspaceRoot = ref<string>(_readStoredWorkspaceRoot());

function toggleAgentEditor(): void {
  activeView.value = activeView.value === "agent-editor" ? "main" : "agent-editor";
}

function openPlugins(): void {
  activeView.value = "plugins";
}

function setWorkspaceRoot(value: string): void {
  workspaceRoot.value = value.trim();
}

// Provide to child components (AppHeader is nested inside SwarmUiPage/layouts)
provide("activeView", activeView);
provide("toggleAgentEditor", toggleAgentEditor);
provide("openPlugins", openPlugins);
provide("setWorkspaceRoot", setWorkspaceRoot);
// Provide the reactive workspace root so WikiGraphPanel can read it directly.
provide("workspaceRoot", workspaceRoot);
</script>
