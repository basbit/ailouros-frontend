import { ref } from "vue";
import type { Ref } from "vue";
import { readRawString, writeRawString } from "@/shared/lib/storage-utils";
import { STORAGE_KEYS } from "@/shared/lib/storage-keys";

export interface ArtifactsPanelState {
  artifactsOpen: Ref<boolean>;
  onArtifactsToggle: (event: Event) => void;
  advancedSidebarOpen: Ref<boolean>;
  onToggleAdvancedSidebar: () => void;
}

export function useArtifactsPanelState(): ArtifactsPanelState {
  const artifactsOpen = ref<boolean>(
    readRawString(STORAGE_KEYS.artifactsPanelOpen.key) !== "0",
  );
  function onArtifactsToggle(event: Event): void {
    const target = event.target as HTMLDetailsElement;
    artifactsOpen.value = target.open;
    writeRawString(STORAGE_KEYS.artifactsPanelOpen.key, target.open ? "1" : "0");
  }

  const advancedSidebarOpen = ref<boolean>(
    readRawString(STORAGE_KEYS.advancedSidebarOpen.key) === "1",
  );
  function onToggleAdvancedSidebar(): void {
    advancedSidebarOpen.value = !advancedSidebarOpen.value;
    writeRawString(
      STORAGE_KEYS.advancedSidebarOpen.key,
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
