export type NodeType =
  | "trigger"
  | "agent"
  | "tool"
  | "condition"
  | "aggregator"
  | "output";

export interface TriggerConfig {
  triggerType: "manual" | "webhook" | "cron";
  cronExpr?: string;
  webhookPath?: string;
}

export interface AgentConfig {
  name: string;
  model: string;
  role: string;
  tools: string[];
  maxSteps: number;
  temperature: number;
  memoryNamespace: string;
}

export interface ConditionConfig {
  fieldPath: string;
  operator: ">" | "<" | "==" | "!=" | "contains";
  value: string;
}

export interface ToolConfig {
  toolName: string;
}

export type NodeConfig =
  | TriggerConfig
  | AgentConfig
  | ConditionConfig
  | ToolConfig
  | Record<string, unknown>;

export interface PipelineNode {
  id: string;
  type: NodeType;
  config: NodeConfig;
  position: { x: number; y: number };
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface PipelineDefinition {
  id?: string;
  name: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  created_at?: string;
  updated_at?: string;
}
