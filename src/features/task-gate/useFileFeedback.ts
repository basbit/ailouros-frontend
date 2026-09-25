import { computed, ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import {
  submitCodegenFeedback,
  taskFeedbackSpecId,
  type CodegenFeedbackVerdict,
} from "@/shared/api/endpoints/codegen-feedback";
import { computeLineDiff } from "@/shared/lib/diff";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";

export type FileFeedbackStatus = "idle" | "composing" | "submitting" | "submitted";

const FEEDBACK_AGENT = "dev";
const ERROR_TOAST_MS = 4200;
// The agent-config swarm section leaves "default" out of the run's
// cross_task_memory, so the run falls back to its workspace namespace.
const DEFAULT_MEMORY_NAMESPACE = "default";

export function configuredMemoryNamespace(raw: string | undefined): string | undefined {
  const namespace = (raw ?? "").trim();
  return namespace && namespace !== DEFAULT_MEMORY_NAMESPACE ? namespace : undefined;
}

export function formatUserEditDiff(before: string, after: string): string {
  return computeLineDiff(before, after)
    .lines.filter((line) => line.type !== "unchanged")
    .map((line) => `${line.type === "added" ? "+" : "-"}${line.text}`)
    .join("\n");
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.body || `HTTP ${error.status}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

interface FileFeedbackOptions {
  taskId: Ref<string | undefined>;
  filePath: Ref<string>;
  userEditDiff: Ref<string | undefined>;
  /** The run's workspace root: feedback is recorded for that project only. */
  workspaceRoot: Ref<string>;
  memoryNamespace: Ref<string | undefined>;
}

export function useFileFeedback({
  taskId,
  filePath,
  userEditDiff,
  workspaceRoot,
  memoryNamespace,
}: FileFeedbackOptions) {
  const { t } = useI18n();
  const ux = useUxStore();

  const status = ref<FileFeedbackStatus>("idle");
  const verdict = ref<CodegenFeedbackVerdict | null>(null);
  const reason = ref("");
  const hasWorkspace = computed(() => workspaceRoot.value.trim() !== "");

  async function send(chosen: CodegenFeedbackVerdict): Promise<void> {
    const task = taskId.value;
    if (!task || !hasWorkspace.value) return;
    status.value = "submitting";
    try {
      await submitCodegenFeedback({
        specId: taskFeedbackSpecId(task),
        agent: FEEDBACK_AGENT,
        targetFile: filePath.value,
        verdict: chosen,
        reason: chosen === "accept" ? undefined : reason.value,
        userEditDiff: chosen === "edit" ? userEditDiff.value : undefined,
        workspaceRoot: workspaceRoot.value.trim(),
        memoryNamespace: configuredMemoryNamespace(memoryNamespace.value),
      });
      status.value = "submitted";
      ux.notify(t("codegenFeedback.sent", { file: filePath.value }), "success");
    } catch (error) {
      status.value = chosen === "accept" ? "idle" : "composing";
      ux.notify(
        t("codegenFeedback.failed", { error: describeError(error) }),
        "error",
        ERROR_TOAST_MS,
      );
    }
  }

  function choose(chosen: CodegenFeedbackVerdict): void {
    if (!hasWorkspace.value) return;
    if (status.value === "submitting" || status.value === "submitted") return;
    verdict.value = chosen;
    if (chosen === "accept") {
      void send("accept");
      return;
    }
    status.value = "composing";
  }

  function submitComposed(): Promise<void> {
    if (status.value !== "composing" || !verdict.value) return Promise.resolve();
    return send(verdict.value);
  }

  function cancel(): void {
    if (status.value !== "composing") return;
    status.value = "idle";
    verdict.value = null;
    reason.value = "";
  }

  return { status, verdict, reason, hasWorkspace, choose, submitComposed, cancel };
}
