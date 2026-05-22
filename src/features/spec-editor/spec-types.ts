type RequirementPriority = "must" | "should" | "could";

export interface Requirement {
  id: string;
  text: string;
  priority: RequirementPriority;
  acceptance: string[];
  ears?: string;
  rationale?: string;
}

export type DesignDecisionStatus = "proposed" | "accepted" | "superseded";

export interface DesignDecision {
  id: string;
  title: string;
  status: DesignDecisionStatus;
  context?: string;
  decision?: string;
  consequences?: string;
  alternatives?: string[];
  requirement_refs?: string[];
}

export type TaskStatus = "open" | "in_progress" | "done";

export interface SpecTask {
  id: string;
  title: string;
  status: TaskStatus;
  description?: string;
  depends_on: string[];
  requirement_refs: string[];
  estimate?: string;
}

type SpecFindingSeverity = "error" | "warning" | "info";

interface SpecFinding {
  code: string;
  severity: SpecFindingSeverity;
  message: string;
  refs?: string[];
}

export interface SpecValidationResult {
  ok: boolean;
  findings: SpecFinding[];
}
