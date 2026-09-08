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
    <div v-else-if="error && entries.length === 0" class="tool-activity__error">
      {{ error }}
    </div>
    <div v-else-if="entries.length === 0" class="tool-activity__hint">
      {{ loading ? "…" : "no activity yet" }}
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
        <div v-if="entry.channel === 'file_ops'" class="tool-activity__file">
          <div class="tool-activity__file-head">
            <span
              class="tool-activity__file-op"
              :class="`tool-activity__file-op--${entry.op}`"
            >
              {{ entry.op }}
            </span>
            <span class="tool-activity__file-path">{{ entry.path }}</span>
          </div>
          <pre v-if="entry.content" class="tool-activity__file-content">{{
            entry.content
          }}</pre>
          <div v-else-if="entry.edits" class="tool-activity__file-edits">
            <div
              v-for="(edit, i) in fileEdits(entry)"
              :key="i"
              class="tool-activity__file-edit"
            >
              <div class="tool-activity__file-edit-search">
                - {{ edit.old_string || edit.search || edit.oldText }}
              </div>
              <div class="tool-activity__file-edit-replace">
                + {{ edit.new_string || edit.replace || edit.newText }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="tool-activity__entry-body">{{ summariseEntry(entry) }}</div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import {
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from "vue";
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
  "file_ops",
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
    case "file_ops":
      return "Files";
    default:
      return channel;
  }
}

function entryKey(entry: ActivityEntry, index: number): string {
  return `${entry.ts}-${index}`;
}

interface FileEdit {
  old_string?: string;
  new_string?: string;
  search?: string;
  replace?: string;
  oldText?: string;
  newText?: string;
}

function fileEdits(entry: ActivityEntry): FileEdit[] {
  const edits = entry.edits;
  if (!Array.isArray(edits)) return [];
  return edits.filter((e): e is FileEdit => !!e && typeof e === "object");
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
  // Keep showing existing entries during a background poll; only show the
  // spinner/state on the first load (entries empty).
  if (entries.value.length === 0) {
    loading.value = true;
  }
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
  entries.value = [];
  loading.value = true;
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

onDeactivated(() => {
  stopPolling();
  if (inflight) inflight.abort();
});

onActivated(() => {
  startPolling();
});
</script>

<style scoped>
.tool-activity {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--card);
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
  color: var(--ink-3);
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
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink-3);
  cursor: pointer;
}
.tool-activity__chip--active {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}
.tool-activity__reload {
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink);
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}
.tool-activity__hint,
.tool-activity__error {
  font-size: 12px;
  color: var(--ink-3);
}
.tool-activity__error {
  color: var(--error);
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
  background: var(--bg-2);
}
.tool-activity__entry-head {
  display: flex;
  gap: 6px;
  font-family: var(--font-mono);
  color: var(--ink-4);
}
.tool-activity__channel {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tool-activity__entry-body {
  font-family: var(--font-mono);
  word-break: break-word;
  color: var(--ink);
}
.tool-activity__file {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tool-activity__file-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tool-activity__file-op {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid var(--line);
  color: var(--ink-3);
}
.tool-activity__file-op--write,
.tool-activity__file-op--edit {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}
.tool-activity__file-op--read {
  color: var(--ok);
  border-color: color-mix(in srgb, var(--ok) 45%, transparent);
}
.tool-activity__file-op--delete {
  color: var(--error);
  border-color: color-mix(in srgb, var(--error) 45%, transparent);
}
.tool-activity__file-path {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink);
  word-break: break-all;
}
.tool-activity__file-content {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 8px;
  margin: 0;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--ink);
}
.tool-activity__file-edits {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tool-activity__file-edit {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.4;
  border: 1px solid var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.tool-activity__file-edit-search {
  background: color-mix(in srgb, var(--error) 12%, transparent);
  color: var(--error);
  padding: 4px 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
.tool-activity__file-edit-replace {
  background: color-mix(in srgb, var(--ok) 12%, transparent);
  color: var(--ok);
  padding: 4px 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
