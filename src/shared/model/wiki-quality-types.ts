type WikiQualitySeverity = "info" | "warning" | "error";

type WikiQualityRuleKey =
  | "paragraph_length"
  | "duplicate_content"
  | "heading_depth"
  | "artifact_contract";

interface WikiQualityFinding {
  rule: WikiQualityRuleKey;
  severity: WikiQualitySeverity;
  article_path: string;
  message: string;
  suggestion: string;
}

interface WikiQualitySummary {
  article_count: number;
  chunk_count: number;
  findings_by_severity: Partial<Record<WikiQualitySeverity, number>>;
}

export interface WikiQualityReport {
  version: number;
  workspace_root: string;
  wiki_root: string;
  summary: WikiQualitySummary;
  findings: WikiQualityFinding[];
}
