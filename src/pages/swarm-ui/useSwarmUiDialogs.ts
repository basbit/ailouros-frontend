import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import {
  usePromptLibrary,
  type PromptEntry,
} from "@/features/prompt-input/usePromptLibrary";
import { useReportProblem } from "@/features/report-a-problem/useReportProblem";
import type { useSettings } from "@/app/providers/useSettings";

type SettingsApi = ReturnType<typeof useSettings>;

export interface SwarmUiDialogs {
  promptLibrary: ReturnType<typeof usePromptLibrary>;
  promptLibraryOpen: Ref<boolean>;
  promptLibraryEntries: Ref<PromptEntry[]>;
  assetUploadOpen: Ref<boolean>;
  reportProblemOpen: Ref<boolean>;
  sudoPromptOpen: Ref<boolean>;
  reportRecentLog: ComputedRef<string>;
  reportArtifactPaths: ComputedRef<string[]>;
  manualSudoCommand: ComputedRef<string>;
  onOpenReportProblem: () => Promise<void>;
  onPromptLibraryPick: (entry: PromptEntry) => void;
  onPromptLibrarySaveCurrent: () => void;
  openAssetUpload: () => void;
  onAssetUploaded: (relativePath: string) => void;
  onSudoPromptConfirm: () => void;
}

export function useSwarmUiDialogs(settings: SettingsApi): SwarmUiDialogs {
  const projectsStore = useProjectsStore();
  const ui = useUiStore();
  const ux = useUxStore();
  const { t } = useI18n();

  const promptLibrary = usePromptLibrary(() => projectsStore.currentId);
  const promptLibraryOpen = promptLibrary.open;
  const promptLibraryEntries = promptLibrary.entries;
  const assetUploadOpen = ref(false);
  const sudoPromptOpen = ref(false);

  const {
    reportProblemOpen,
    reportRecentLog,
    reportArtifactPaths,
    openReportProblem: onOpenReportProblem,
  } = useReportProblem();

  const manualSudoCommand = computed(
    () => ui.manualShellCommands.find((cmd) => /^\s*sudo(\s|$)/.test(cmd)) ?? "",
  );

  function onPromptLibraryPick(entry: PromptEntry): void {
    settings.form.prompt = entry.body;
    settings.saveSettingsSoon();
  }

  function onPromptLibrarySaveCurrent(): void {
    const body = settings.form.prompt.trim();
    if (!body) return;
    const title = body.split(/\r?\n/)[0]?.trim().slice(0, 72) || "Prompt";
    promptLibrary.add({
      title,
      body,
      tags: [settings.form.scenario_id ?? "custom"],
    });
    promptLibrary.closePanel();
    ux.notify(t("promptLibrary.saved"), "info", 1500);
  }

  function openAssetUpload(): void {
    if (!settings.form.workspace_root.trim()) {
      ux.notify(
        t("assetUpload.error", { error: "workspace_root is required" }),
        "error",
        2500,
      );
      return;
    }
    assetUploadOpen.value = true;
  }

  function onAssetUploaded(relativePath: string): void {
    const clean = relativePath.trim();
    if (!clean) return;
    const mention = `@${clean}`;
    const current = settings.form.prompt.trimEnd();
    if (!current.includes(mention)) {
      settings.form.prompt = current ? `${current}\n${mention}` : mention;
      settings.saveSettingsSoon();
    }
    assetUploadOpen.value = false;
    ux.notify(t("assetUpload.inserted"), "info", 1500);
  }

  function onSudoPromptConfirm(): void {
    sudoPromptOpen.value = false;
    ux.notify(t("sudoPrompt.disabled"), "error", 2500);
  }

  return {
    promptLibrary,
    promptLibraryOpen,
    promptLibraryEntries,
    assetUploadOpen,
    reportProblemOpen,
    sudoPromptOpen,
    reportRecentLog,
    reportArtifactPaths,
    manualSudoCommand,
    onOpenReportProblem,
    onPromptLibraryPick,
    onPromptLibrarySaveCurrent,
    openAssetUpload,
    onAssetUploaded,
    onSudoPromptConfirm,
  };
}
