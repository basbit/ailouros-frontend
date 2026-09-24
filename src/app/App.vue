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
  <DesktopBackendBanner />
</template>

<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { readStoredWorkspaceRoot } from "@/entities/project";
import { AppDialogHost, AppToastStack } from "@/widgets/notifier";
import UpdateBanner from "@/widgets/update-banner/UpdateBanner.vue";
import CommandPalette from "@/widgets/command-palette/CommandPalette.vue";
import { DesktopBackendBanner } from "@/features/desktop-backend-status";
import ErrorBoundary from "@/shared/components/ErrorBoundary.vue";
import { useCommandPaletteStore } from "@/shared/store/command-palette";
import { useAttentionAlert } from "@/features/attention-alert/useAttentionAlert";
import {
  useAppBootstrap,
  APP_SETTINGS_KEY,
  SWARM_RUN_CONTROLLER_KEY,
  GLOBAL_SETTINGS_KEY,
  PROJECT_FORM_ACTIONS_KEY,
} from "./use-app-bootstrap";

useAttentionAlert();

const router = useRouter();

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
    void router.push("/settings/api-keys");
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
