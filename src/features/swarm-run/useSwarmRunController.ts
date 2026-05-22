import { useWs } from "@/shared/lib/use-ws";
import { type RunSwarmChatSettings } from "@/shared/lib/agent-config";
import { useSwarmRunState } from "./useSwarmRunState";
import { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";
import { useSwarmRunActions } from "./useSwarmRunActions";

export function useSwarmRunController(settings: RunSwarmChatSettings) {
  const state = useSwarmRunState();
  const tickHandler = useSwarmRunTickHandler(state);

  let wsSendSubscribeFn = () => {};

  function sendWsSubscribe(): void {
    wsSendSubscribeFn();
  }

  const { sendSubscribe } = useWs({
    onOpen() {
      sendSubscribe(state.ui.taskId ?? undefined);
    },
    onMessage(msg) {
      if (typeof msg !== "object" || msg === null) return;
      const d = msg as Record<string, unknown>;
      if (d.type !== "tick") return;
      tickHandler.applyTick(d);
    },
  });

  wsSendSubscribeFn = () => sendSubscribe(state.ui.taskId ?? undefined);

  const actions = useSwarmRunActions({
    state,
    tickHandler,
    sendWsSubscribe,
    settings,
  });

  return {
    ui: state.ui,
    isRunning: state.isRunning,
    currentPipelineSteps: state.currentPipelineSteps,
    sendWsSubscribe,
    syncTaskFromServer: tickHandler.syncTaskFromServer,
    applyTick: tickHandler.applyTick,
    onStartRun: actions.onStartRun,
    onStopRun: actions.onStopRun,
    onHumanResume: actions.onHumanResume,
    onConfirmShell: actions.onConfirmShell,
    onConfirmManualShell: actions.onConfirmManualShell,
    onRetry: actions.onRetry,
    onContinuePipeline: actions.onContinuePipeline,
  };
}
