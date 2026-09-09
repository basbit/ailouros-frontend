import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_ORCHESTRATION: FeatureFlagGroup = {
  id: "orchestration",
  fields: [
    {
      kind: "enum",
      field: "swarm_orchestration_skill_dispatcher",
      envName: "SWARM_ORCHESTRATION_SKILL_DISPATCHER",
      wired: true,
      options: [
        { value: "off", i18nSuffix: "off" },
        { value: "heuristic", i18nSuffix: "heuristic" },
        { value: "llm", i18nSuffix: "llm" },
      ],
    },
    {
      kind: "boolean",
      field: "swarm_orchestration_skill_dispatcher_auto",
      envName: "SWARM_ORCHESTRATION_SKILL_DISPATCHER_AUTO",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_orchestration_quick_fix",
      envName: "SWARM_ORCHESTRATION_QUICK_FIX_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_orchestration_phase_verification_required",
      envName: "SWARM_ORCHESTRATION_PHASE_VERIFICATION_REQUIRED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_gate_audit_persist",
      envName: "SWARM_GATE_AUDIT_PERSIST",
      wired: true,
    },
    {
      kind: "string",
      field: "swarm_dev_qa_task_count",
      envName: "SWARM_DEV_QA_TASK_COUNT",
      placeholder: "auto (e.g. 3)",
      wired: true,
    },
    {
      kind: "string",
      field: "swarm_max_parallel_tasks",
      envName: "SWARM_MAX_PARALLEL_TASKS",
      placeholder: "4",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_force_sequential",
      envName: "SWARM_FORCE_SEQUENTIAL",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_parallel_safe_auto",
      envName: "SWARM_PARALLEL_SAFE_AUTO",
      wired: true,
    },
    {
      kind: "enum",
      field: "swarm_engine",
      envName: "SWARM_ENGINE",
      wired: true,
      options: [
        { value: "linear", i18nSuffix: "linear" },
        { value: "graph", i18nSuffix: "graph" },
      ],
    },
    {
      kind: "boolean",
      field: "swarm_tracer_bullet_enabled",
      envName: "SWARM_TRACER_BULLET_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_tracer_revision_gate",
      envName: "SWARM_TRACER_REVISION_GATE",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_require_dev_writes",
      envName: "SWARM_REQUIRE_DEV_WRITES",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_require_trusted_gates_pass",
      envName: "SWARM_REQUIRE_TRUSTED_GATES_PASS",
      wired: true,
    },
  ],
};
