<template>
  <div class="terminal-panel" :class="{ 'terminal-panel--collapsed': isCollapsed }">
    <div class="terminal-panel__header">
      <div class="terminal-panel__title" @click="isCollapsed = !isCollapsed">
        <span class="terminal-panel__icon">&#9646;</span>
        <span>Computer & Process Terminal</span>
        <span v-if="processes.length > 0" class="process-count-badge">
          {{ runningProcessesCount }} active
        </span>
      </div>

      <div class="terminal-panel__actions">
        <button
          v-if="activePid"
          type="button"
          class="term-btn term-btn--danger"
          @click="onKillActiveProcess"
        >
          Stop PID {{ activePid }}
        </button>
        <button type="button" class="term-btn" @click="clearLogs">Clear</button>
        <button type="button" class="term-btn" @click="fetchProcesses">Refresh</button>
        <button
          type="button"
          class="term-btn term-btn--icon"
          :title="isCollapsed ? 'Expand Terminal' : 'Collapse Terminal'"
          @click="isCollapsed = !isCollapsed"
        >
          {{ isCollapsed ? "▲" : "▼" }}
        </button>
      </div>
    </div>

    <div v-show="!isCollapsed" class="terminal-panel__content">
      <!-- Process Selector Tabs -->
      <div v-if="processes.length > 0" class="process-tabs">
        <button
          v-for="proc in processes"
          :key="proc.process_id"
          type="button"
          class="process-tab"
          :class="{
            'process-tab--active': activePid === proc.process_id,
            'process-tab--stopped': proc.status !== 'running',
          }"
          @click="selectProcess(proc.process_id)"
        >
          <span
            class="status-dot"
            :class="{ 'status-dot--green': proc.status === 'running' }"
          />
          <span class="process-name">{{ proc.command.slice(0, 24) }}</span>
          <span class="process-pid">({{ proc.pid }})</span>
        </button>
      </div>

      <!-- Terminal Output Screen -->
      <div ref="outputRef" class="terminal-screen">
        <pre v-if="logs" class="terminal-text">{{ logs }}</pre>
        <div v-else class="terminal-empty">
          No logs or active background processes.
        </div>
      </div>

      <!-- Quick Command Bar -->
      <form class="terminal-command-bar" @submit.prevent="onRunCommand">
        <span class="command-prompt">$</span>
        <input
          v-model="inputCommand"
          type="text"
          placeholder="Execute shell command..."
          class="command-input"
          :disabled="isRunningCommand"
        />
        <button
          type="submit"
          class="command-submit-btn"
          :disabled="isRunningCommand || !inputCommand.trim()"
        >
          {{ isRunningCommand ? "Running..." : "Run" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import {
  type SupervisedProcessDto,
  executeShell,
  getSupervisedProcessLogs,
  listSupervisedProcesses,
  stopSupervisedProcess,
} from "@/shared/api/endpoints/shell";

const props = defineProps<{ workspaceRoot?: string }>();

const isCollapsed = ref(false);
const processes = ref<SupervisedProcessDto[]>([]);
const activePid = ref<string | null>(null);
const logs = ref<string>("");
const inputCommand = ref("");
const isRunningCommand = ref(false);
const outputRef = ref<HTMLDivElement | null>(null);

const POLL_INTERVAL_MS = 3000;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const runningProcessesCount = computed(
  () => processes.value.filter((p) => p.status === "running").length,
);

async function fetchProcesses(): Promise<void> {
  try {
    const data = await listSupervisedProcesses();
    processes.value = data.processes ?? [];
    if (!activePid.value && processes.value.length > 0) {
      activePid.value = processes.value[0].process_id;
    }
  } catch {
    /* a background poll must not surface as a toast */
  }
}

async function fetchLogs(): Promise<void> {
  if (!activePid.value) return;
  try {
    const data = await getSupervisedProcessLogs(activePid.value, 200);
    logs.value = data.logs ?? "";
    scrollToBottom();
  } catch {
    /* a background poll must not surface as a toast */
  }
}

function selectProcess(pid: string): void {
  activePid.value = pid;
  void fetchLogs();
}

async function onKillActiveProcess(): Promise<void> {
  if (!activePid.value) return;
  const stopped = activePid.value;
  try {
    await stopSupervisedProcess(stopped);
    logs.value += `\n[Process ${stopped} stopped]\n`;
    await fetchProcesses();
  } catch (err: unknown) {
    logs.value += `\n[Stop failed]: ${String(err)}\n`;
  }
}

function clearLogs(): void {
  logs.value = "";
}

async function onRunCommand(): Promise<void> {
  const cmd = inputCommand.value.trim();
  if (!cmd || isRunningCommand.value) return;

  isRunningCommand.value = true;
  logs.value += `\n$ ${cmd}\n`;
  scrollToBottom();

  try {
    const res = await executeShell(cmd, true, props.workspaceRoot);
    logs.value += res.output || "";
    if (res.error) {
      logs.value += `\n[Error]: ${res.error}\n`;
    }
    inputCommand.value = "";
    await fetchProcesses();
  } catch (err: unknown) {
    logs.value += `\n[Execution failed]: ${String(err)}\n`;
  } finally {
    isRunningCommand.value = false;
    scrollToBottom();
  }
}

function scrollToBottom(): void {
  nextTick(() => {
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight;
    }
  });
}

function startPolling(): void {
  stopPolling();
  void fetchProcesses();
  pollTimer = setInterval(() => {
    if (!isCollapsed.value) {
      void fetchProcesses();
      void fetchLogs();
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

onMounted(startPolling);
onUnmounted(stopPolling);
onDeactivated(stopPolling);
onActivated(startPolling);
</script>

<style scoped>
.terminal-panel {
  display: flex;
  flex-direction: column;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

.terminal-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #161b22;
  border-bottom: 1px solid #30363d;
}

.terminal-panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #c9d1d9;
  cursor: pointer;
}

.terminal-panel__icon {
  color: #58a6ff;
}

.process-count-badge {
  font-size: 11px;
  background: rgba(46, 213, 115, 0.2);
  color: #2ed573;
  padding: 1px 6px;
  border-radius: 10px;
}

.terminal-panel__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.term-btn {
  background: #21262d;
  border: 1px solid #30363d;
  color: #c9d1d9;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.term-btn:hover {
  background: #30363d;
}

.term-btn--danger {
  background: rgba(255, 71, 87, 0.2);
  border-color: #ff4757;
  color: #ff4757;
}

.term-btn--icon {
  padding: 3px 6px;
}

.terminal-panel__content {
  display: flex;
  flex-direction: column;
}

.process-tabs {
  display: flex;
  gap: 4px;
  padding: 6px 12px;
  background: #0d1117;
  border-bottom: 1px solid #21262d;
  overflow-x: auto;
}

.process-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 4px;
  padding: 4px 8px;
  color: #8b949e;
  font-size: 11px;
  cursor: pointer;
}

.process-tab--active {
  background: #21262d;
  color: #f0f6fc;
  border-color: #58a6ff;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8b949e;
}

.status-dot--green {
  background: #3fb950;
  box-shadow: 0 0 6px #3fb950;
}

.terminal-screen {
  background: #090d13;
  padding: 12px;
  min-height: 160px;
  max-height: 320px;
  overflow-y: auto;
}

.terminal-text {
  margin: 0;
  color: #e6edf3;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.terminal-empty {
  color: #484f58;
  font-size: 12px;
  font-style: italic;
}

.terminal-command-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #161b22;
  border-top: 1px solid #30363d;
}

.command-prompt {
  color: #3fb950;
  font-weight: bold;
}

.command-input {
  flex: 1;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 4px;
  padding: 4px 8px;
  color: #f0f6fc;
  font-size: 12px;
  font-family: inherit;
  outline: none;
}

.command-input:focus {
  border-color: #58a6ff;
}

.command-submit-btn {
  background: #238636;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
}

.command-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
