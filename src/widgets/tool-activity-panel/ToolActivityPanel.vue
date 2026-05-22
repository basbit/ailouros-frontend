<template>
  <section class="tool-activity">
    <header class="tool-activity__head">
      <span class="tool-activity__title">Tool activity</span>
      <div class="tool-activity__filters">
        <button
          v-for="channel in availableChannels"
          :key="channel"
          type="button"
          class="tool-activity__chip"
          :class="{ 'tool-activity__chip--active': channel === currentChannel }"
          @click="onChannelClick(channel)"
        >
          {{ channelLabel(channel) }}
        </button>
      </div>
      <button
        type="button"
        class="tool-activity__reload"
        :disabled="loading"
        @click="reload"
      >
        ↻
      </button>
    </header>
    <div v-if="!taskId" class="tool-activity__hint">no task selected</div>
    <div v-else-if="loading" class="tool-activity__hint">…</div>
    <div v-else-if="error" class="tool-activity__error">{{ error }}</div>
    <div v-else-if="entries.length === 0" class="tool-activity__hint">
      no activity yet
    </div>
    <ul v-else class="tool-activity__list">
      <li
        v-for="(entry, index) in entries"
        :key="entryKey(entry, index)"
        class="tool-activity__entry"
      >
        <div class="tool-activity__entry-head">
          <span class="tool-activity__ts">{{ formatTime(entry.ts) }}</span>
          <span v-if="entry.step" class="tool-activity__step">{{ entry.step }}</span>
          <span class="tool-activity__channel">{{ entry.channel }}</span>
        </div>
        <div class="tool-activity__entry-body">{{ summariseEntry(entry) }}</div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  type ActivityChannel,
  type ActivityEntry,
  getActivityTail,
} from "@/shared/api/endpoints/activity";

interface Props {
  taskId: string | null;
  pollIntervalMs?: number;
  defaultChannel?: ActivityChannel;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  pollIntervalMs: 2500,
  defaultChannel: "mcp_calls",
  limit: 100,
});

const availableChannels: ActivityChannel[] = [
  "mcp_calls",
  "web_searches",
  "page_fetches",
  "qdrant_ops",
  "rag_hits",
];

const currentChannel = ref<ActivityChannel>(props.defaultChannel);
const entries = ref<ActivityEntry[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;
let inflight: AbortController | null = null;

function channelLabel(channel: ActivityChannel): string {
  switch (channel) {
    case "mcp_calls":
      return "MCP";
    case "web_searches":
      return "Web";
    case "page_fetches":
      return "Fetch";
    case "qdrant_ops":
      return "Qdrant";
    case "rag_hits":
      return "RAG";
    default:
      return channel;
  }
}

function entryKey(entry: ActivityEntry, index: number): string {
  return `${entry.ts}-${index}`;
}

function formatTime(raw: string): string {
  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) return raw;
  return value.toLocaleTimeString();
}

function summariseEntry(entry: ActivityEntry): string {
  if (entry.channel === "mcp_calls") {
    const server = String(entry.server ?? "?");
    const tool = String(entry.tool ?? "?");
    const status = String(entry.status ?? "ok");
    const elapsed = entry.elapsed_ms !== undefined ? ` ${entry.elapsed_ms}ms` : "";
    return `${server}.${tool} → ${status}${elapsed}`;
  }
  if (entry.channel === "web_searches") {
    const provider = String(entry.provider ?? "?");
    const status = String(entry.status ?? "ok");
    const hits = entry.hit_count !== undefined ? ` ${entry.hit_count} hits` : "";
    return `${provider} ${String(entry.query ?? "")} → ${status}${hits}`;
  }
  if (entry.channel === "qdrant_ops") {
    const op = String(entry.op ?? "?");
    const collection = String(entry.collection ?? "?");
    const hits = entry.hit_count !== undefined ? ` ${entry.hit_count} hits` : "";
    return `${op} ${collection}${hits}`;
  }
  if (entry.channel === "page_fetches") {
    const status = String(entry.status ?? "ok");
    const bytes = entry.bytes !== undefined ? ` ${entry.bytes}b` : "";
    return `${String(entry.url ?? "")} → ${status}${bytes}`;
  }
  return JSON.stringify(entry);
}

async function reload(): Promise<void> {
  if (!props.taskId) {
    entries.value = [];
    error.value = null;
    return;
  }
  if (inflight) {
    inflight.abort();
  }
  inflight = new AbortController();
  loading.value = true;
  error.value = null;
  try {
    const response = await getActivityTail(
      props.taskId,
      currentChannel.value,
      props.limit,
      inflight.signal,
    );
    entries.value = response.entries;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    error.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

function startPolling(): void {
  stopPolling();
  if (!props.taskId) return;
  pollTimer = setInterval(() => {
    void reload();
  }, props.pollIntervalMs);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function onChannelClick(channel: ActivityChannel): void {
  if (currentChannel.value === channel) return;
  currentChannel.value = channel;
  void reload();
}

watch(
  () => props.taskId,
  () => {
    entries.value = [];
    void reload();
    startPolling();
  },
);

onMounted(() => {
  void reload();
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
  if (inflight) inflight.abort();
});
</script>

<style scoped>
.tool-activity {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 60%, transparent);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 120px;
}
.tool-activity__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tool-activity__title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
}
.tool-activity__filters {
  display: flex;
  gap: 4px;
  flex: 1;
}
.tool-activity__chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border, #2a2f3e);
  background: transparent;
  color: var(--text2, #a8b0c4);
  cursor: pointer;
}
.tool-activity__chip--active {
  background: var(--accent, #6c8cff);
  color: var(--surface, #1a1d29);
  border-color: transparent;
}
.tool-activity__reload {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text, #f5f0e7);
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}
.tool-activity__hint,
.tool-activity__error {
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.tool-activity__error {
  color: var(--error, #d7563f);
}
.tool-activity__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column-reverse;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
}
.tool-activity__entry {
  font-size: 11px;
  padding: 4px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface-2, #11141d) 80%, transparent);
}
.tool-activity__entry-head {
  display: flex;
  gap: 6px;
  font-family: var(--mono, ui-monospace, monospace);
  color: var(--text3, #6b7280);
}
.tool-activity__channel {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tool-activity__entry-body {
  font-family: var(--mono, ui-monospace, monospace);
  word-break: break-word;
  color: var(--text, #f5f0e7);
}
</style>
