import type { CodeGeneratorKind } from "@/shared/model/code-generator-types";

export interface ExternalHarness {
  name: string;
  generator_type: CodeGeneratorKind;
  is_available: boolean;
  binary_path: string | null;
  description: string;
}
