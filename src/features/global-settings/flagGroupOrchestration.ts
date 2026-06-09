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
      field: "swarm_orchestration_phase_loop_auto_advance",
      envName: "SWARM_ORCHESTRATION_PHASE_LOOP_AUTO_ADVANCE",
      wired: false,
    },
    {
      kind: "boolean",
      field: "swarm_orchestration_status_enabled",
      envName: "SWARM_ORCHESTRATION_STATUS_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_orchestration_spec_lint",
      envName: "SWARM_ORCHESTRATION_SPEC_LINT_ENABLED",
      wired: true,
    },
  ],
};
