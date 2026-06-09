import type { Messages } from "./types";
import { runIdleLiveDoneEn, runIdleLiveDoneRu } from "./run-idle-live-done";
import { runArtifactsUxEn, runArtifactsUxRu } from "./run-artifacts-ux";
import { runOrchestrationEn, runOrchestrationRu } from "./run-orchestration";
import { runDiagnosticsI18nEn, runDiagnosticsI18nRu } from "./run-diagnostics-i18n";

export const runEn: Messages = {
  ...runIdleLiveDoneEn,
  ...runArtifactsUxEn,
  ...runOrchestrationEn,
  ...runDiagnosticsI18nEn,
};

export const runRu: Messages = {
  ...runIdleLiveDoneRu,
  ...runArtifactsUxRu,
  ...runOrchestrationRu,
  ...runDiagnosticsI18nRu,
};
