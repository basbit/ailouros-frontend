import type { Ref } from "vue";
import { usePersistedFlag } from "@/shared/lib/use-persisted-flag";
import { STORAGE_KEYS } from "@/shared/lib/storage-keys";

export interface ArtifactsPanelState {
  areArtifactsOpen: Ref<boolean>;
  onArtifactsToggle: (event: Event) => void;
  isAdvancedSidebarOpen: Ref<boolean>;
  onToggleAdvancedSidebar: () => void;
}

export function useArtifactsPanelState(): ArtifactsPanelState {
  const areArtifactsOpen = usePersistedFlag(STORAGE_KEYS.artifactsPanelOpen.key, true);
  function onArtifactsToggle(event: Event): void {
    areArtifactsOpen.value = (event.target as HTMLDetailsElement).open;
  }

  const isAdvancedSidebarOpen = usePersistedFlag(
    STORAGE_KEYS.isAdvancedSidebarOpen.key,
    false,
  );
  function onToggleAdvancedSidebar(): void {
    isAdvancedSidebarOpen.value = !isAdvancedSidebarOpen.value;
  }

  return {
    areArtifactsOpen,
    onArtifactsToggle,
    isAdvancedSidebarOpen,
    onToggleAdvancedSidebar,
  };
}
