// Canonical option set for `agent_config.swarm.code_generator`.
// Must stay in sync with CODE_GENERATOR_KINDS in
// app/backend/App/orchestration/domain/agents/code_generator_port.py and with
// app/config/external_agent_harnesses.json.
export type CodeGeneratorKind = "native" | "claude_code" | "aider";

export const CODE_GENERATOR_DEFAULT: CodeGeneratorKind = "native";
