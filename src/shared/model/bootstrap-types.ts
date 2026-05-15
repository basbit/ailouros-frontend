/**
 * Desktop bootstrap progress types — shared between the local-models feature
 * (which emits them) and the onboarding-desktop feature (which consumes them).
 */
export type BootstrapStage =
  | "preparing-tree"
  | "fetching-python"
  | "creating-venv"
  | "installing-backend"
  | "staging-llama-cpp"
  | "staging-mcp-runtimes"
  | "downloading-model"
  | "ready";

export interface BootstrapProgress {
  stage: BootstrapStage;
  fraction: number;
  message: string;
}
