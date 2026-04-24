import { fetchJson } from "@/shared/api/client";

export interface PipelineNodeDto {
  id: string;
  type: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface PipelineEdgeDto {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface PipelineDefinitionDto {
  id?: string;
  name: string;
  nodes: PipelineNodeDto[];
  edges: PipelineEdgeDto[];
  created_at?: string;
  updated_at?: string;
}

export interface PipelineListItemDto {
  id: string;
  name: string;
  updated_at?: string;
}

export async function createPipelineDefinition(
  payload: PipelineDefinitionDto,
): Promise<PipelineDefinitionDto> {
  return fetchJson<PipelineDefinitionDto>("/api/pipelines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updatePipelineDefinition(
  pipelineId: string,
  payload: PipelineDefinitionDto,
): Promise<PipelineDefinitionDto> {
  return fetchJson<PipelineDefinitionDto>(
    `/api/pipelines/${encodeURIComponent(pipelineId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export async function listPipelineDefinitions(): Promise<PipelineListItemDto[]> {
  return fetchJson<PipelineListItemDto[]>("/api/pipelines");
}

export async function getPipelineDefinition(
  pipelineId: string,
): Promise<PipelineDefinitionDto> {
  return fetchJson<PipelineDefinitionDto>(
    `/api/pipelines/${encodeURIComponent(pipelineId)}`,
  );
}

export async function deletePipelineDefinition(
  pipelineId: string,
): Promise<{ ok: boolean; id: string }> {
  return fetchJson<{ ok: boolean; id: string }>(
    `/api/pipelines/${encodeURIComponent(pipelineId)}`,
    { method: "DELETE" },
  );
}
