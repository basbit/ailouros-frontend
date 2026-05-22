type QuantKind = "Q3KM" | "Q4KM" | "Q5KM" | "Q8_0" | "BF16" | "OTHER";

interface ModelSource {
  url: string;
  sha256?: string | null;
}

interface ModelEntry {
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

export type { BootstrapProgress } from "@/shared/model/bootstrap-types";
