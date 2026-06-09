interface StatusPhaseBlock {
  currentPhase: string;
  autoAdvanceAllowed: boolean;
  isTerminal: boolean;
  historySteps: number;
}

interface StatusHierarchyBlock {
  milestoneId: string;
  milestoneTitle: string;
  planCount: number;
  waveCount: number;
  taskCount: number;
  pendingTasks: number;
  completedTasks: number;
  blockedTasks: number;
}

interface StatusArtefactsBlock {
  scenario: string;
  required: string[];
  missing: string[];
  empty: string[];
  uncategorised: string[];
  isComplete: boolean;
}

interface StatusLintBlock {
  enabled: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  blockingCount: number;
}

export interface OrchestrationStatusSnapshot {
  scenario: string;
  phase: StatusPhaseBlock;
  hierarchy: StatusHierarchyBlock;
  artefacts: StatusArtefactsBlock;
  lint: StatusLintBlock;
  notes: string[];
}

interface RawPhaseBlock {
  current_phase?: unknown;
  auto_advance_allowed?: unknown;
  is_terminal?: unknown;
  history_steps?: unknown;
}

interface RawHierarchyBlock {
  milestone_id?: unknown;
  milestone_title?: unknown;
  plan_count?: unknown;
  wave_count?: unknown;
  task_count?: unknown;
  pending_tasks?: unknown;
  completed_tasks?: unknown;
  blocked_tasks?: unknown;
}

interface RawArtefactsBlock {
  scenario?: unknown;
  required?: unknown;
  missing?: unknown;
  empty?: unknown;
  uncategorised?: unknown;
  is_complete?: unknown;
}

interface RawLintBlock {
  enabled?: unknown;
  error_count?: unknown;
  warning_count?: unknown;
  info_count?: unknown;
  blocking_count?: unknown;
}

interface RawSnapshot {
  scenario?: unknown;
  phase?: unknown;
  hierarchy?: unknown;
  artefacts?: unknown;
  lint?: unknown;
  notes?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 0;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function parsePhase(raw: unknown): StatusPhaseBlock {
  if (!raw || typeof raw !== "object") {
    return {
      currentPhase: "",
      autoAdvanceAllowed: false,
      isTerminal: false,
      historySteps: 0,
    };
  }
  const candidate = raw as RawPhaseBlock;
  return {
    currentPhase: readString(candidate.current_phase),
    autoAdvanceAllowed: readBoolean(candidate.auto_advance_allowed),
    isTerminal: readBoolean(candidate.is_terminal),
    historySteps: readInteger(candidate.history_steps),
  };
}

function parseHierarchy(raw: unknown): StatusHierarchyBlock {
  if (!raw || typeof raw !== "object") {
    return {
      milestoneId: "",
      milestoneTitle: "",
      planCount: 0,
      waveCount: 0,
      taskCount: 0,
      pendingTasks: 0,
      completedTasks: 0,
      blockedTasks: 0,
    };
  }
  const candidate = raw as RawHierarchyBlock;
  return {
    milestoneId: readString(candidate.milestone_id),
    milestoneTitle: readString(candidate.milestone_title),
    planCount: readInteger(candidate.plan_count),
    waveCount: readInteger(candidate.wave_count),
    taskCount: readInteger(candidate.task_count),
    pendingTasks: readInteger(candidate.pending_tasks),
    completedTasks: readInteger(candidate.completed_tasks),
    blockedTasks: readInteger(candidate.blocked_tasks),
  };
}

function parseArtefacts(raw: unknown): StatusArtefactsBlock {
  if (!raw || typeof raw !== "object") {
    return {
      scenario: "",
      required: [],
      missing: [],
      empty: [],
      uncategorised: [],
      isComplete: true,
    };
  }
  const candidate = raw as RawArtefactsBlock;
  return {
    scenario: readString(candidate.scenario),
    required: readStringArray(candidate.required),
    missing: readStringArray(candidate.missing),
    empty: readStringArray(candidate.empty),
    uncategorised: readStringArray(candidate.uncategorised),
    isComplete: candidate.is_complete !== false,
  };
}

function parseLint(raw: unknown): StatusLintBlock {
  if (!raw || typeof raw !== "object") {
    return {
      enabled: false,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      blockingCount: 0,
    };
  }
  const candidate = raw as RawLintBlock;
  return {
    enabled: readBoolean(candidate.enabled),
    errorCount: readInteger(candidate.error_count),
    warningCount: readInteger(candidate.warning_count),
    infoCount: readInteger(candidate.info_count),
    blockingCount: readInteger(candidate.blocking_count),
  };
}

export function parseOrchestrationStatusPayload(
  raw: unknown,
): OrchestrationStatusSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawSnapshot;
  const scenario = readString(candidate.scenario);
  if (!scenario) return null;
  return {
    scenario,
    phase: parsePhase(candidate.phase),
    hierarchy: parseHierarchy(candidate.hierarchy),
    artefacts: parseArtefacts(candidate.artefacts),
    lint: parseLint(candidate.lint),
    notes: readStringArray(candidate.notes),
  };
}
