<template>
  <details class="memory-panel" @toggle="onToggle">
    <summary class="memory-panel-header">{{ t("memory.title") }}</summary>
    <div class="memory-panel-body">
      <div v-if="loaded && entries.length" class="field">
        <input
          v-model="searchQuery"
          type="text"
          class="memory-search"
          :placeholder="t('memory.searchPlaceholder')"
        />
      </div>
      <div v-if="loading" class="memory-panel-hint">{{ t("memory.loading") }}</div>
      <div v-else-if="error" class="memory-panel-hint" style="color: #c0392b">
        {{ error }}
      </div>
      <div v-else-if="!entries.length" class="memory-panel-hint">
        {{ t("memory.empty") }}
      </div>
      <div v-else-if="!filteredEntries.length" class="memory-panel-hint">
        {{ t("memory.emptyFiltered") }}
      </div>
      <div v-else class="memory-panel-chips">
        <span
          v-for="entry in filteredEntries"
          :key="entry.key ?? entry.timestamp ?? entry.text"
          class="memory-chip-wrap"
          :class="{
            'memory-chip-wrap--pattern': entry.source === 'pattern_memory',
            'memory-chip-wrap--qdrant': entry.source === 'qdrant',
          }"
        >
          <button
            type="button"
            class="memory-chip"
            :title="chipTooltip(entry)"
            @click="onChipClick(entry.text)"
          >
            {{ truncate(entry.text, 55) }}
          </button>
          <button
            v-if="isDeletable(entry)"
            type="button"
            class="memory-chip-del"
            title="Delete this note"
            @click.stop="deleteEntry(entry)"
          >
            ×
          </button>
        </span>
      </div>
      <div class="memory-panel-footer">
        <button
          type="button"
          class="memory-consolidate-btn"
          :disabled="consolidating"
          :title="consolidateStatus || 'Cluster episodes and extract reusable patterns'"
          @click="consolidate"
        >
          {{ consolidating ? t("memory.consolidating") : t("memory.consolidate") }}
        </button>
        <span
          v-if="consolidateStatus"
          class="memory-panel-hint"
          style="margin-left: 6px"
        >
          {{ consolidateStatus }}
        </span>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { ApiError } from "@/shared/api/client";
import {
  consolidateMemoryNotes,
  deleteMemoryNote,
  listMemoryNotes,
  listQdrantEntries,
  type MemoryEntry,
} from "@/shared/api/endpoints/memory";
import { useI18n } from "@/shared/lib/i18n";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const emit = defineEmits<{
  appendToPrompt: [text: string];
}>();
const { t } = useI18n();

const entries = ref<MemoryEntry[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const consolidating = ref(false);
const consolidateStatus = ref<string | null>(null);
const searchQuery = ref("");
let loaded = false;

const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return entries.value;
  return entries.value.filter((entry) =>
    [entry.text, entry.namespace, entry.key].some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(query),
    ),
  );
});

async function loadEntries(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const data = await listMemoryNotes();
    if (data.error) {
      error.value = data.error;
      entries.value = [];
    } else {
      entries.value = data.entries ?? [];
    }
    try {
      const qdrant = await listQdrantEntries(undefined, 200);
      entries.value = [...entries.value, ...qdrant.entries];
    } catch (qdrantErr) {
      frontendLogger.warn("memory: qdrant entries unavailable", qdrantErr);
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

function onToggle(event: Event): void {
  const details = event.target as HTMLDetailsElement;
  if (details.open && !loaded) {
    loaded = true;
    void loadEntries();
  }
}

function onMemoryNoteSaved(): void {
  void loadEntries();
}

onMounted(() => {
  window.addEventListener("memory-note-saved", onMemoryNoteSaved);
});

onUnmounted(() => {
  window.removeEventListener("memory-note-saved", onMemoryNoteSaved);
});

function onChipClick(text: string): void {
  emit("appendToPrompt", text);
}

function isDeletable(entry: MemoryEntry): boolean {
  return entry.source !== "pattern_memory" && entry.source !== "qdrant";
}

function chipTooltip(entry: MemoryEntry): string {
  if (entry.source === "pattern_memory" || entry.source === "qdrant") {
    const ns = entry.namespace ? `${entry.namespace} / ` : "";
    const scorePart =
      entry.source === "qdrant" && typeof entry.score === "number"
        ? `  score=${entry.score.toFixed(3)}`
        : "";
    return `${ns}${entry.key ?? ""}${scorePart}\n\n${entry.text}`;
  }
  return entry.text;
}

async function deleteEntry(entry: MemoryEntry): Promise<void> {
  if (!isDeletable(entry)) return;
  const deletableEntries = entries.value.filter(isDeletable);
  const deletableIdx = deletableEntries.findIndex((item) => item === entry);
  if (deletableIdx < 0) return;
  try {
    await deleteMemoryNote(deletableIdx);
    const absoluteIdx = entries.value.findIndex((item) => item === entry);
    if (absoluteIdx >= 0) entries.value.splice(absoluteIdx, 1);
  } catch (e: unknown) {
    error.value =
      e instanceof ApiError
        ? e.body || `HTTP ${e.status}`
        : e instanceof Error
          ? e.message
          : String(e);
  }
}

async function consolidate(): Promise<void> {
  consolidating.value = true;
  consolidateStatus.value = null;
  try {
    const data = await consolidateMemoryNotes();
    if (data.error) {
      consolidateStatus.value = `Error: ${data.error}`;
    } else {
      consolidateStatus.value = `Done: ${data.entries_processed ?? 0} entries processed`;
    }
  } catch (e: unknown) {
    consolidateStatus.value =
      e instanceof ApiError
        ? `Error HTTP ${e.status}`
        : e instanceof Error
          ? e.message
          : String(e);
  } finally {
    consolidating.value = false;
  }
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "…";
}
</script>

<style scoped>
.memory-panel {
  margin-top: 6px;
}
.memory-panel-header {
  cursor: pointer;
  font-size: 12px;
  color: #aaa;
  user-select: none;
}
.memory-panel-body {
  padding: 6px 0 2px;
}
.memory-search {
  width: 100%;
}
.memory-panel-hint {
  font-size: 11px;
  color: #888;
}
.memory-panel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.memory-chip-wrap {
  display: inline-flex;
  align-items: center;
  background: #2a3a4a;
  border: 1px solid #3a4a5a;
  border-radius: 12px;
  overflow: hidden;
}
.memory-chip-wrap:hover {
  border-color: #4a6a8a;
}
.memory-chip-wrap--pattern {
  background: #2a3a3a;
  border-color: #3a5a5a;
}
.memory-chip-wrap--qdrant {
  background: #3a2a3a;
  border-color: #5a3a5a;
}
.memory-chip {
  background: transparent;
  border: none;
  padding: 2px 6px 2px 10px;
  font-size: 11px;
  color: #ccc;
  cursor: pointer;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.memory-chip:hover {
  color: #fff;
}
.memory-chip-del {
  background: transparent;
  border: none;
  border-left: 1px solid #3a4a5a;
  padding: 2px 7px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  line-height: 1;
  flex-shrink: 0;
}
.memory-chip-del:hover {
  color: #f03e3e;
  background: rgba(240, 62, 62, 0.1);
}
.memory-panel-footer {
  margin-top: 6px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.memory-consolidate-btn {
  background: #1a2a3a;
  border: 1px solid #3a4a5a;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11px;
  color: #ccc;
  cursor: pointer;
}
.memory-consolidate-btn:hover:not(:disabled) {
  background: #2a4a6a;
  color: #fff;
}
.memory-consolidate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
