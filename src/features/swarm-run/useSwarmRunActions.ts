import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { type RunSwarmChatSettings } from "@/entities/agent-config";
import { useSwarmRunPreflight } from "./useSwarmRunPreflight";
import { useSwarmRunStart } from "./useSwarmRunStart";
import { useSwarmRunGateActions } from "./useSwarmRunGateActions";
import { useSwarmRunForkAction } from "./useSwarmRunForkAction";
import type { SwarmRunState } from "./useSwarmRunState";
import type { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

interface ActionsDeps {
  state: SwarmRunState;
  tickHandler: ReturnType<typeof useSwarmRunTickHandler>;
  sendWsSubscribe: () => void;
  settings: RunSwarmChatSettings;
}

/**
 * Thin aggregator: composes the focused start/gate action composables and
 * exposes the flat action API consumed by the run controller.
 */
export function useSwarmRunActions({
  state,
  tickHandler,
  sendWsSubscribe,
  settings,
}: ActionsDeps) {
  const ux = useUxStore();
  const { t } = useI18n();
  const preflight = useSwarmRunPreflight(state, settings);

  const { onStartRun, onStopRun } = useSwarmRunStart({
    state,
    tickHandler,
    sendWsSubscribe,
    settings,
    ux,
    t,
    preflight,
  });

  const {
    onHumanResume,
    onConfirmShell,
    onConfirmManualShell,
    onRetry,
    onContinuePipeline,
  } = useSwarmRunGateActions({
    state,
    tickHandler,
    sendWsSubscribe,
    settings,
    ux,
  });

  const { onForkStep } = useSwarmRunForkAction({
    state,
    sendWsSubscribe,
    settings,
    ux,
  });

  return {
    onStartRun,
    onStopRun,
    onHumanResume,
    onConfirmShell,
    onConfirmManualShell,
    onRetry,
    onContinuePipeline,
    onForkStep,
  };
}
