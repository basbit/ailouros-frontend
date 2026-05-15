/**
 * useArtifactsPanelState — localStorage-backed open/closed state for the
 * artifacts <details> panel and the advanced sidebar toggle.
 */

import { ref } from "vue";
import type { Ref } from "vue";

const LS_ARTIFACTS_OPEN_KEY = "swarm.artifacts-panel-open";
const LS_ADVANCED_SIDEBAR_KEY = "swarm.sidebar-advanced-open";

export interface ArtifactsPanelState {
  artifactsOpen: Ref<boolean>;
  onArtifactsToggle: (event: Event) => void;
  advancedSidebarOpen: Ref<boolean>;
  onToggleAdvancedSidebar: () => void;
}

export function useArtifactsPanelState(): ArtifactsPanelState {
  const artifactsOpen = ref<boolean>(
    localStorage.getItem(LS_ARTIFACTS_OPEN_KEY) !== "0",
  );
  function onArtifactsToggle(event: Event): void {
    const target = event.target as HTMLDetailsElement;
    artifactsOpen.value = target.open;
    localStorage.setItem(LS_ARTIFACTS_OPEN_KEY, target.open ? "1" : "0");
  }

  const advancedSidebarOpen = ref<boolean>(
    localStorage.getItem(LS_ADVANCED_SIDEBAR_KEY) === "1",
  );
  function onToggleAdvancedSidebar(): void {
    advancedSidebarOpen.value = !advancedSidebarOpen.value;
    localStorage.setItem(
      LS_ADVANCED_SIDEBAR_KEY,
      advancedSidebarOpen.value ? "1" : "0",
    );
  }

  return {
    artifactsOpen,
    onArtifactsToggle,
    advancedSidebarOpen,
    onToggleAdvancedSidebar,
  };
}
