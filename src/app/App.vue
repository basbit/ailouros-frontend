<template>
  <SwarmUiPage v-if="activeView !== 'wiki-graph'" />
  <WikiGraphPage v-else />
  <AppDialogHost />
  <AppToastStack />
</template>

<script setup lang="ts">
import { ref, provide } from "vue";
import { useSwarmDefaults } from "@/shared/lib/use-swarm-defaults";
import { LS_SETTINGS } from "@/shared/store";
import SwarmUiPage from "@/pages/swarm-ui/SwarmUiPage.vue";
import WikiGraphPage from "@/pages/wiki-graph/WikiGraphPage.vue";
import AppDialogHost from "@/widgets/feedback/AppDialogHost.vue";
import AppToastStack from "@/widgets/feedback/AppToastStack.vue";

useSwarmDefaults();

const activeView = ref<"main" | "wiki-graph">("main");

// Initialise from localStorage so WikiGraphPage has the value immediately on mount.
function _readStoredWorkspaceRoot(): string {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return "";
    return (JSON.parse(raw) as { workspace_root?: string }).workspace_root?.trim() ?? "";
  } catch {
    return "";
  }
}

const workspaceRoot = ref<string>(_readStoredWorkspaceRoot());

function toggleWikiGraph(): void {
  activeView.value = activeView.value === "wiki-graph" ? "main" : "wiki-graph";
}

function setWorkspaceRoot(value: string): void {
  workspaceRoot.value = value.trim();
}

// Provide to child components (AppHeader is nested inside SwarmUiPage/layouts)
provide("activeView", activeView);
provide("toggleWikiGraph", toggleWikiGraph);
provide("setWorkspaceRoot", setWorkspaceRoot);
// Provide the reactive workspace root so WikiGraphPage can read it directly.
provide("workspaceRoot", workspaceRoot);
</script>
