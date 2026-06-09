import { httpDelete, httpGet, httpPost, httpPut } from "@/shared/api/http";

interface PipelineNodeDto {
  id: string;
  type: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

interface PipelineEdgeDto {
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
  return httpPost<PipelineDefinitionDto>("/v1/pipelines", payload);
}

export async function updatePipelineDefinition(
  pipelineId: string,
  payload: PipelineDefinitionDto,
): Promise<PipelineDefinitionDto> {
  return httpPut<PipelineDefinitionDto>(
    `/v1/pipelines/${encodeURIComponent(pipelineId)}`,
    payload,
  );
}

export async function listPipelineDefinitions(): Promise<PipelineListItemDto[]> {
  return httpGet<PipelineListItemDto[]>("/v1/pipelines");
}

export async function getPipelineDefinition(
  pipelineId: string,
): Promise<PipelineDefinitionDto> {
  return httpGet<PipelineDefinitionDto>(
    `/v1/pipelines/${encodeURIComponent(pipelineId)}`,
  );
}

export async function deletePipelineDefinition(
  pipelineId: string,
): Promise<{ ok: boolean; id: string }> {
  return httpDelete<{ ok: boolean; id: string }>(
    `/v1/pipelines/${encodeURIComponent(pipelineId)}`,
  );
}
