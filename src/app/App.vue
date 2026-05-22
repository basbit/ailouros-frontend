<template>
  <UpdateBanner />
  <ErrorBoundary @captured="onAppError">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </ErrorBoundary>
  <CommandPalette />
  <AppDialogHost />
  <AppToastStack />
</template>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { LS_PROJECTS, LS_SETTINGS } from "@/shared/lib/swarm-ui-constants";
import { loadJSON } from "@/shared/lib/storage-utils";
import AppDialogHost from "@/widgets/feedback/AppDialogHost.vue";
import AppToastStack from "@/widgets/feedback/AppToastStack.vue";
import UpdateBanner from "@/widgets/update-banner/UpdateBanner.vue";
import CommandPalette from "@/widgets/command-palette/CommandPalette.vue";
import ErrorBoundary from "@/shared/components/ErrorBoundary.vue";
import { useCommandPaletteStore } from "@/shared/store/command-palette";
import {
  useAppBootstrap,
  APP_SETTINGS_KEY,
  SWARM_RUN_CONTROLLER_KEY,
  GLOBAL_SETTINGS_KEY,
  PROJECT_FORM_ACTIONS_KEY,
} from "./use-app-bootstrap";

const router = useRouter();

function readStoredWorkspaceRoot(): string {
  const projects = loadJSON<{
    current?: string;
    projects?: Record<string, { snap?: { workspace_root?: string } }>;
  } | null>(LS_PROJECTS, null);
  if (projects) {
    const currentId = projects.current ?? "";
    const projectRoot =
      projects.projects?.[currentId]?.snap?.workspace_root?.trim() ?? "";
    if (projectRoot) return projectRoot;
  }
  const settings = loadJSON<{ workspace_root?: string } | null>(LS_SETTINGS, null);
  return settings?.workspace_root?.trim() ?? "";
}

const workspaceRoot = ref<string>(readStoredWorkspaceRoot());

function setWorkspaceRoot(value: string): void {
  workspaceRoot.value = value.trim();
}

const { settings, controller, globalSettings, projectForm } =
  useAppBootstrap(setWorkspaceRoot);

const commandPalette = useCommandPaletteStore();

function handleGlobalShortcut(event: KeyboardEvent): void {
  const isMod = event.metaKey || event.ctrlKey;
  if (!isMod) return;
  const key = event.key.toLowerCase();
  if (key === "k") {
    event.preventDefault();
    commandPalette.toggle();
    return;
  }
  if (key === ",") {
    event.preventDefault();
    void router.push("/settings/profile");
  }
}

function onAppError(error: unknown, info: string): void {
  if (typeof console !== "undefined" && console.error) {
    console.error("[App] uncaught error in router view:", error, info);
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleGlobalShortcut);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalShortcut);
});

provide("workspaceRoot", workspaceRoot);
provide(APP_SETTINGS_KEY, settings);
provide(SWARM_RUN_CONTROLLER_KEY, controller);
provide(GLOBAL_SETTINGS_KEY, globalSettings);
provide(PROJECT_FORM_ACTIONS_KEY, projectForm);
</script>
