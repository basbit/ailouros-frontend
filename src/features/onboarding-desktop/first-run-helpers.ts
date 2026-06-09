import type { Ref } from "vue";
import {
  getOnboardingModels,
  type LocalProviderProbe,
} from "@/shared/api/endpoints/onboarding";
import {
  recommendOnboardingPath,
  type LlmOnboardingPath,
  type LocalLlmDetection,
} from "@/shared/lib/local-llm-detect";
import type { BootstrapProgress, BootstrapStage, StageRuntimeState } from "./types";

export interface InternalStageState {
  state: StageRuntimeState;
  fraction: number;
  message: string;
}

export interface ProgressApplyContext {
  visibleStages: readonly BootstrapStage[];
  stageMap: Record<BootstrapStage, InternalStageState>;
  ready: Ref<boolean>;
  backendFailureMessage: Ref<string | null>;
  onFailed: () => void;
}

export function applyProgressEvent(
  progress: BootstrapProgress,
  ctx: ProgressApplyContext,
): void {
  if (progress.stage === "ready") {
    for (const stage of ctx.visibleStages) {
      if (
        ctx.stageMap[stage].state === "active" ||
        ctx.stageMap[stage].state === "pending"
      ) {
        ctx.stageMap[stage] = { state: "done", fraction: 1, message: "" };
      }
    }
    ctx.ready.value = true;
    ctx.backendFailureMessage.value = null;
    return;
  }

  if (progress.stage === "failed") {
    ctx.backendFailureMessage.value = progress.message;
    const waiting = ctx.stageMap["waiting-for-backend"];
    if (waiting) {
      ctx.stageMap["waiting-for-backend"] = {
        state: "error",
        fraction: 0,
        message: progress.message,
      };
    }
    ctx.onFailed();
    return;
  }

  if (!(progress.stage in ctx.stageMap)) return;
  const previous = ctx.stageMap[progress.stage];
  if (previous.state === "done" || previous.state === "skipped") return;

  const isComplete = progress.fraction >= 1;
  const isSkipped =
    progress.stage === "downloading-model" && /skipped/i.test(progress.message);

  ctx.stageMap[progress.stage] = {
    state: isSkipped ? "skipped" : isComplete ? "done" : "active",
    fraction: progress.fraction,
    message: progress.message,
  };
}

export interface ProviderDetectionContext {
  detectedProviders: Ref<LocalLlmDetection | null>;
  recommendedPath: Ref<LlmOnboardingPath | null>;
  localProviderProbes: Ref<LocalProviderProbe[]>;
  error: Ref<string | null>;
}

function probeByProvider(
  probes: LocalProviderProbe[],
  provider: LocalProviderProbe["provider"],
): LocalProviderProbe {
  const probe = probes.find((p) => p.provider === provider);
  if (!probe) {
    throw new Error(`backend response missing probe for ${provider}`);
  }
  return probe;
}

export async function refreshLocalProviderDetection(
  ctx: ProviderDetectionContext,
): Promise<void> {
  try {
    const models = await getOnboardingModels("");
    if (!models.providers || !models.ollama || !models.lm_studio) {
      throw new Error("backend response missing providers, ollama, or lm_studio");
    }
    const probes = models.providers;
    ctx.localProviderProbes.value = probes;
    const ollamaProbe = probeByProvider(probes, "ollama");
    const lmStudioProbe = probeByProvider(probes, "lm_studio");
    const result: LocalLlmDetection = {
      ollama: models.ollama.length > 0,
      lmStudio: models.lm_studio.length > 0,
      ollamaBaseUrl: ollamaProbe.base_url,
      lmStudioBaseUrl: lmStudioProbe.base_url,
    };
    ctx.detectedProviders.value = result;
    ctx.recommendedPath.value = recommendOnboardingPath(result);
  } catch (detectError) {
    ctx.detectedProviders.value = null;
    ctx.recommendedPath.value = null;
    ctx.localProviderProbes.value = [];
    ctx.error.value =
      detectError instanceof Error ? detectError.message : String(detectError);
  }
}
