/**
 * Local type definitions for the spec-editor feature skeleton.
 *
 * These mirror the shape of the backend ``Specification`` / ``SpecValidationResult``
 * dataclasses (see ``backend/App/orchestration/application/spec/spec_validator.py``
 * and ``backend/App/orchestration/domain/spec.py``). When a shared entity layer for
 * specs lands, these can move under ``src/entities/spec``; for now the feature
 * keeps them private so we don't break FSD boundaries.
 */

export type RequirementPriority = "must" | "should" | "could";

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

export type SpecFindingSeverity = "error" | "warning" | "info";

export interface SpecFinding {
  code: string;
  severity: SpecFindingSeverity;
  message: string;
  refs?: string[];
}

export interface SpecValidationResult {
  ok: boolean;
  findings: SpecFinding[];
}

export interface SpecPayload {
  id: string;
  requirements: Requirement[];
  decisions: DesignDecision[];
  tasks: SpecTask[];
}
