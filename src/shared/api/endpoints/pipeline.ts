import { fetchJson } from "@/shared/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A single pipeline step definition as understood by the orchestrator.
 * Additional fields may be present depending on the step type.
 */
export interface PipelineStep {
  id: string;
  /** Display label shown in the UI step list. */
  label?: string;
  /** Whether the step is currently enabled. */
  enabled?: boolean;
}

/**
 * Response from GET /pipeline/presets (list of named presets, e.g. "full", "quick").
 */
export interface PipelinePresetsResponse {
  presets: PipelinePreset[];
}

export interface PipelinePreset {
  id: string;
  label?: string;
  steps: string[];
}

/**
 * Pipeline plan snapshot stored at
 * /artifacts/{taskId}/pipeline.json after a run completes.
 *
 * Shape mirrors the existing PipelineJsonSnapshot in artifacts.ts but is
 * more complete here for use by the pipeline editor.
 */
export interface PipelinePlanSnapshot {
  pipeline_steps?: string[];
  failed_step?: string;
  partial_state?: Record<string, unknown>;
  workspace_writes?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  clarify_input_cache?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch the list of available pipeline presets from the server.
 *
 * GET /pipeline/presets
 */
export async function getPipelinePresets(): Promise<PipelinePresetsResponse> {
  return fetchJson<PipelinePresetsResponse>("/pipeline/presets");
}

/**
 * Fetch the pipeline.json artifact snapshot for a completed or failed task.
 *
 * GET /artifacts/{taskId}/pipeline.json
 *
 * This is a typed alias of getArtifactPipelineJson that returns the richer
 * PipelinePlanSnapshot shape — use this in the pipeline editor, the artifacts
 * endpoint for display-only contexts.
 */
export async function getTaskPipelinePlan(
  taskId: string,
): Promise<PipelinePlanSnapshot> {
  return fetchJson<PipelinePlanSnapshot>(
    `/artifacts/${encodeURIComponent(taskId)}/pipeline.json`,
  );
}

/**
 * Validate a list of pipeline step IDs against the server registry.
 *
 * POST /pipeline/validate
 * Body: { steps: string[] }
 */
export interface PipelineValidateResponse {
  valid: boolean;
  unknown_steps?: string[];
  message?: string;
}

export async function postPipelineValidate(
  steps: string[],
): Promise<PipelineValidateResponse> {
  return fetchJson<PipelineValidateResponse>("/pipeline/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ steps }),
  });
}
