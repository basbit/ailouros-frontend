import { ref } from "vue";
import type { TaskStatus } from "@/shared/model/task-types";
import type { PipelinePlanSnapshot } from "@/shared/api/endpoints/pipeline";
import { LS_ACTIVE_TASK } from "@/shared/lib/swarm-constants";

export interface ServerCapabilities {
  workspace_write?: boolean;
  command_exec?: boolean;
}

export interface HostMetrics {
  cpu_percent?: number;
  memory_percent?: number;
  memory_used_gb?: number;
  memory_total_gb?: number;
  loadavg?: number[];
  gpu_percent?: number;
  gpu_memory_percent?: number;
  gpu_memory_used_gb?: number;
  gpu_memory_total_gb?: number;
  gpu_name?: string;
  gpu_count?: number;
  gpu_source?: string;
  timestamp_ms?: number;
  error?: string;
}

export interface HostMetricsSample {
  t: number;
  cpu: number | null;
  mem: number | null;
  gpu: number | null;
}

export const HOST_METRICS_HISTORY_MAX = 120;

export function createTaskRefs() {
  const taskId = ref<string | null>(null);
  const taskStatus = ref<TaskStatus | null>(null);
  const taskError = ref<unknown>(null);
  const taskHistory = ref<
    {
      id?: string;
      agent?: string;
      message?: string;
      timestamp?: string;
      status?: string;
    }[]
  >([]);
  const taskAgents = ref<string[]>([]);
  const taskScenarioId = ref<string | null>(null);
  const taskScenarioTitle = ref<string | null>(null);
  const taskScenarioCategory = ref<string | null>(null);

  const capabilities = ref<ServerCapabilities | null>(null);
  const hostMetrics = ref<HostMetrics | null>(null);
  const hostMetricsHistory = ref<HostMetricsSample[]>([]);

  const artifactPath = ref<string | null>(null);
  const taskPipelinePlan = ref<PipelinePlanSnapshot | null>(null);

  const activeStep = ref<string | null>(null);
  const contextMode = ref<string | null>(null);
  const toolsEnabled = ref<boolean>(true);
  const mcpPhase = ref<string | null>(null);
  const pendingApprovals = ref<number>(0);

  const retryingSteps = ref<Set<string>>(new Set());
  const orchestratorCompletedSteps = ref<Set<string>>(new Set());
  const verificationRunning = ref<boolean>(false);

  function pushHostMetricsSample(m: HostMetrics | null): void {
    if (!m) return;
    const t =
      typeof m.timestamp_ms === "number" && Number.isFinite(m.timestamp_ms)
        ? m.timestamp_ms
        : Date.now();
    const buf = hostMetricsHistory.value;
    if (buf.length && buf[buf.length - 1].t === t) return;
    const cpu =
      typeof m.cpu_percent === "number" && Number.isFinite(m.cpu_percent)
        ? m.cpu_percent
        : null;
    const mem =
      typeof m.memory_percent === "number" && Number.isFinite(m.memory_percent)
        ? m.memory_percent
        : null;
    const gpu =
      typeof m.gpu_percent === "number" && Number.isFinite(m.gpu_percent)
        ? m.gpu_percent
        : null;
    const next = buf.length >= HOST_METRICS_HISTORY_MAX ? buf.slice(1) : buf.slice();
    next.push({ t, cpu, mem, gpu });
    hostMetricsHistory.value = next;
  }

  function clearHostMetricsHistory(): void {
    hostMetricsHistory.value = [];
  }

  return {
    taskId,
    taskStatus,
    taskError,
    taskHistory,
    taskAgents,
    taskScenarioId,
    taskScenarioTitle,
    taskScenarioCategory,
    capabilities,
    hostMetrics,
    hostMetricsHistory,
    artifactPath,
    taskPipelinePlan,
    activeStep,
    contextMode,
    toolsEnabled,
    mcpPhase,
    pendingApprovals,
    retryingSteps,
    orchestratorCompletedSteps,
    verificationRunning,
    pushHostMetricsSample,
    clearHostMetricsHistory,
  };
}

function activeTaskKey(pid: string): string {
  return LS_ACTIVE_TASK + "_" + pid;
}

export function persistActiveTask(taskIdValue: string | null, pid: string): void {
  if (!taskIdValue) {
    try {
      localStorage.removeItem(activeTaskKey(pid));
    } catch (e) {
      void e;
    }
  } else {
    try {
      localStorage.setItem(activeTaskKey(pid), JSON.stringify({ taskId: taskIdValue }));
    } catch (e) {
      void e;
    }
  }
}

export function restoreActiveTask(pid: string): string | null {
  try {
    const key = activeTaskKey(pid);
    let raw = localStorage.getItem(key);
    if (!raw && pid === "default") {
      const leg = localStorage.getItem(LS_ACTIVE_TASK);
      if (leg) {
        localStorage.setItem(key, leg);
        raw = leg;
      }
    }
    if (!raw) return null;
    const j = JSON.parse(raw);
    return j && j.taskId ? String(j.taskId).trim() : null;
  } catch {
    return null;
  }
}

export function resetTaskRefs(t: ReturnType<typeof createTaskRefs>): void {
  t.taskId.value = null;
  t.taskStatus.value = null;
  t.taskError.value = null;
  t.taskHistory.value = [];
  t.taskAgents.value = [];
  t.taskScenarioId.value = null;
  t.taskScenarioTitle.value = null;
  t.taskScenarioCategory.value = null;
  t.artifactPath.value = null;
  t.taskPipelinePlan.value = null;
  t.activeStep.value = null;
  t.contextMode.value = null;
  t.toolsEnabled.value = true;
  t.mcpPhase.value = null;
  t.pendingApprovals.value = 0;
  t.retryingSteps.value = new Set();
  t.orchestratorCompletedSteps.value = new Set();
  t.verificationRunning.value = false;
}
