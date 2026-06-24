import { ref } from "vue";
import type { Ref } from "vue";
import { readRawString, writeRawString } from "@/shared/lib/storage-utils";
import { STORAGE_KEYS } from "@/shared/lib/storage-keys";

export interface ArtifactsPanelState {
  areArtifactsOpen: Ref<boolean>;
  onArtifactsToggle: (event: Event) => void;
  isAdvancedSidebarOpen: Ref<boolean>;
  onToggleAdvancedSidebar: () => void;
}

export function useArtifactsPanelState(): ArtifactsPanelState {
  const areArtifactsOpen = ref<boolean>(
    readRawString(STORAGE_KEYS.artifactsPanelOpen.key) !== "0",
  );
  function onArtifactsToggle(event: Event): void {
    const target = event.target as HTMLDetailsElement;
    areArtifactsOpen.value = target.open;
    writeRawString(STORAGE_KEYS.artifactsPanelOpen.key, target.open ? "1" : "0");
  }

  const isAdvancedSidebarOpen = ref<boolean>(
    readRawString(STORAGE_KEYS.isAdvancedSidebarOpen.key) === "1",
  );
  function onToggleAdvancedSidebar(): void {
    isAdvancedSidebarOpen.value = !isAdvancedSidebarOpen.value;
    writeRawString(
      STORAGE_KEYS.isAdvancedSidebarOpen.key,
      isAdvancedSidebarOpen.value ? "1" : "0",
    );
  }

  return {
    areArtifactsOpen,
    onArtifactsToggle,
    isAdvancedSidebarOpen,
    onToggleAdvancedSidebar,
  };
}
