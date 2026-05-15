/**
 * useSwarmUiDialogs — prompt library, asset upload, report-problem, sudo
 * prompt dialog state and helpers extracted from `SwarmUiPage`.
 *
 * Keep this strictly UI-glue. No business decisions here — just store-binding
 * and small string transforms identical to the original page behaviour.
 */

import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { invokeCommand, isDesktop } from "@/shared/lib/desktop-bridge";
import { useProjectsStore } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import {
  usePromptLibrary,
  type PromptEntry,
} from "@/features/prompt-input/usePromptLibrary";
import type { useSettings } from "@/widgets/settings/useSettings";

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
  const reportProblemOpen = ref(false);
  const reportDesktopLog = ref<string>("");
  const sudoPromptOpen = ref(false);

  const manualSudoCommand = computed(
    () => ui.manualShellCommands.find((cmd) => /^\s*sudo(\s|$)/.test(cmd)) ?? "",
  );

  const reportRecentLog = computed(() => {
    const taskLog = ui.taskHistory
      .slice(-12)
      .map((entry) => {
        const agent = entry.agent ? `[${entry.agent}] ` : "";
        return `${agent}${entry.message ?? ""}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");
    if (reportDesktopLog.value) {
      return [taskLog, reportDesktopLog.value].filter(Boolean).join("\n\n");
    }
    return taskLog;
  });

  const reportArtifactPaths = computed(() => {
    const paths: string[] = [];
    if (ui.artifactPath) paths.push(ui.artifactPath);
    const plan = ui.taskPipelinePlan as Record<string, unknown> | null;
    const artifactsDir = plan?.artifacts_dir;
    if (typeof artifactsDir === "string" && artifactsDir.trim()) {
      paths.push(artifactsDir.trim());
    }
    return paths;
  });

  async function onOpenReportProblem(): Promise<void> {
    reportDesktopLog.value = "";
    if (isDesktop()) {
      try {
        const tail = await invokeCommand<string>("read_desktop_logs", {
          maxLinesPerFile: 120,
        });
        if (typeof tail === "string" && tail.trim()) {
          reportDesktopLog.value = tail.trim();
        }
      } catch {
        reportDesktopLog.value = "";
      }
    }
    reportProblemOpen.value = true;
  }

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
