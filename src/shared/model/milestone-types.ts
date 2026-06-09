type HierarchyStatus = "pending" | "active" | "done" | "blocked";

interface HierarchyTask {
  readonly taskId: string;
  readonly title: string;
  readonly status: HierarchyStatus;
}

interface HierarchyWave {
  readonly waveId: string;
  readonly title: string;
  readonly status: HierarchyStatus;
  readonly tasks: readonly HierarchyTask[];
}

interface HierarchyPlan {
  readonly planId: string;
  readonly title: string;
  readonly status: HierarchyStatus;
  readonly waves: readonly HierarchyWave[];
}

export interface Milestone {
  readonly milestoneId: string;
  readonly title: string;
  readonly status: HierarchyStatus;
  readonly plans: readonly HierarchyPlan[];
}

interface RawTask {
  task_id?: unknown;
  title?: unknown;
  status?: unknown;
}

interface RawWave {
  wave_id?: unknown;
  title?: unknown;
  status?: unknown;
  tasks?: unknown;
}

interface RawPlan {
  plan_id?: unknown;
  title?: unknown;
  status?: unknown;
  waves?: unknown;
}

interface RawMilestone {
  milestone_id?: unknown;
  title?: unknown;
  status?: unknown;
  plans?: unknown;
}

const KNOWN_STATUSES: Set<HierarchyStatus> = new Set([
  "pending",
  "active",
  "done",
  "blocked",
]);

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStatus(value: unknown): HierarchyStatus {
  const candidate = readString(value) as HierarchyStatus;
  return KNOWN_STATUSES.has(candidate) ? candidate : "pending";
}

function parseTask(raw: unknown): HierarchyTask | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawTask;
  const taskId = readString(candidate.task_id).trim();
  if (!taskId) return null;
  return {
    taskId,
    title: readString(candidate.title),
    status: readStatus(candidate.status),
  };
}

function parseWave(raw: unknown): HierarchyWave | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawWave;
  const waveId = readString(candidate.wave_id).trim();
  if (!waveId) return null;
  const tasks = Array.isArray(candidate.tasks)
    ? candidate.tasks
        .map(parseTask)
        .filter((entry): entry is HierarchyTask => entry !== null)
    : [];
  return {
    waveId,
    title: readString(candidate.title),
    status: readStatus(candidate.status),
    tasks,
  };
}

function parsePlan(raw: unknown): HierarchyPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPlan;
  const planId = readString(candidate.plan_id).trim();
  if (!planId) return null;
  const waves = Array.isArray(candidate.waves)
    ? candidate.waves
        .map(parseWave)
        .filter((entry): entry is HierarchyWave => entry !== null)
    : [];
  return {
    planId,
    title: readString(candidate.title),
    status: readStatus(candidate.status),
    waves,
  };
}

export function parseMilestonePayload(raw: unknown): Milestone | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawMilestone;
  const milestoneId = readString(candidate.milestone_id).trim();
  if (!milestoneId) return null;
  const plans = Array.isArray(candidate.plans)
    ? candidate.plans
        .map(parsePlan)
        .filter((entry): entry is HierarchyPlan => entry !== null)
    : [];
  return {
    milestoneId,
    title: readString(candidate.title),
    status: readStatus(candidate.status),
    plans,
  };
}
