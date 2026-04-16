<template>
  <UpdateBanner />
  <SwarmUiPage v-if="activeView === 'main'" />
  <AgentEditorPage v-else-if="activeView === 'agent-editor'" />
  <AppDialogHost />
  <AppToastStack />
</template>

<script setup lang="ts">
import { ref, provide, defineAsyncComponent } from "vue";
import { useSwarmDefaults } from "@/shared/lib/use-swarm-defaults";
import { LS_SETTINGS } from "@/shared/store";
import SwarmUiPage from "@/pages/swarm-ui/SwarmUiPage.vue";
import AppDialogHost from "@/widgets/feedback/AppDialogHost.vue";
import AppToastStack from "@/widgets/feedback/AppToastStack.vue";
import UpdateBanner from "@/widgets/update-banner/UpdateBanner.vue";

// Lazy-load the Agent Editor — its @vue-flow/* dependencies are large and
// only needed when the editor view is first opened.
const AgentEditorPage = defineAsyncComponent(
  () => import("@/pages/agent-editor/AgentEditorPage.vue"),
);

useSwarmDefaults();

const activeView = ref<"main" | "agent-editor">("main");

// Initialise from localStorage so WikiGraphPanel has the workspace root
// available immediately after mount (used to fetch the wiki graph on open).
function _readStoredWorkspaceRoot(): string {
  try {
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

function setWorkspaceRoot(value: string): void {
  workspaceRoot.value = value.trim();
}

// Provide to child components (AppHeader is nested inside SwarmUiPage/layouts)
provide("activeView", activeView);
provide("toggleAgentEditor", toggleAgentEditor);
provide("setWorkspaceRoot", setWorkspaceRoot);
// Provide the reactive workspace root so WikiGraphPanel can read it directly.
provide("workspaceRoot", workspaceRoot);
</script>
