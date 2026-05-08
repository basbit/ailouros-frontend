export type QuantKind = "Q3KM" | "Q4KM" | "Q5KM" | "Q8_0" | "BF16" | "OTHER";

export interface ModelSource {
  url: string;
  sha256?: string | null;
}

export interface ModelEntry {
  id: string;
  label: string;
  family: string;
  params: string;
  quant: QuantKind;
  format: string;
  size_bytes: number;
  source: ModelSource;
  license: string;
  default: boolean;
  supported_runtimes: string[];
}

export interface AvailableModelView {
  entry: ModelEntry;
  on_disk: boolean;
  is_default: boolean;
}

export interface LocalModelView {
  file_name: string;
  absolute_path: string;
}

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
