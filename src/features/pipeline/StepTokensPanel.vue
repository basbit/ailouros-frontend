<template>
  <details class="panel step-tokens-panel" :open="open" @toggle="onToggle">
    <summary class="panel-header">
      <span class="panel-title">Tokens</span>
      <span v-if="steps.length" class="hint">
        {{ steps.length }} step{{ steps.length === 1 ? "" : "s" }}
      </span>
    </summary>
    <div class="panel-body">
      <div v-if="loading" class="step-tokens-panel__state">Loading metrics…</div>
      <div
        v-else-if="error"
        class="step-tokens-panel__state step-tokens-panel__state--error"
      >
        {{ error }}
      </div>
      <div v-else-if="!steps.length" class="step-tokens-panel__state">
        No metrics yet
      </div>
      <table v-else class="step-tokens-table">
        <thead>
          <tr>
            <th
              v-for="col in COLUMNS"
              :key="col.key"
              class="step-tokens-table__th"
              :class="{ 'step-tokens-table__th--active': sortKey === col.key }"
              @click="setSort(col.key)"
            >
              {{ col.label }}
              <span v-if="sortKey === col.key" class="step-tokens-table__sort-arrow">
                {{ sortAsc ? "▲" : "▼" }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in sortedSteps"
            :key="row.step_id"
            class="step-tokens-table__row"
          >
            <td class="step-tokens-table__td step-tokens-table__td--name">
              {{ row.step_id }}
            </td>
            <td class="step-tokens-table__td step-tokens-table__td--num">
              {{ fmtMs(row.p50_ms) }}
            </td>
            <td class="step-tokens-table__td step-tokens-table__td--num">
              {{ fmtN(row.input_tokens) }}
            </td>
            <td class="step-tokens-table__td step-tokens-table__td--num">
              {{ fmtN(row.output_tokens) }}
            </td>
            <td class="step-tokens-table__td step-tokens-table__td--num">
              {{ row.tool_calls_count }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="step-tokens-table__totals">
            <td class="step-tokens-table__td">Total</td>
            <td class="step-tokens-table__td step-tokens-table__td--num">—</td>
            <td class="step-tokens-table__td step-tokens-table__td--num">
              {{ fmtN(totalIn) }}
            </td>
            <td class="step-tokens-table__td step-tokens-table__td--num">
              {{ fmtN(totalOut) }}
            </td>
            <td class="step-tokens-table__td step-tokens-table__td--num">
              {{ totalTools }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

interface StepMetric {
  step_id: string;
  count: number;
  p50_ms: number;
  input_tokens: number;
  output_tokens: number;
  tool_calls_count: number;
}

type SortKey = keyof StepMetric;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "step_id", label: "Step" },
  { key: "p50_ms", label: "p50 ms" },
  { key: "input_tokens", label: "In tokens" },
  { key: "output_tokens", label: "Out tokens" },
  { key: "tool_calls_count", label: "Tools" },
];

const props = defineProps<{ taskId: string }>();

const steps = ref<StepMetric[]>([]);
const loading = ref(false);
const error = ref("");
const open = ref(false);
const sortKey = ref<SortKey>("step_id");
const sortAsc = ref(true);

let intervalId: ReturnType<typeof setInterval> | null = null;

async function fetchMetrics(): Promise<void> {
  if (!props.taskId) return;
  try {
    const res = await fetch(`/v1/tasks/${encodeURIComponent(props.taskId)}/metrics`);
    if (!res.ok) {
      error.value = `Failed to load metrics (HTTP ${res.status})`;
      return;
    }
    const data = (await res.json()) as { steps: StepMetric[] };
    steps.value = data.steps ?? [];
    error.value = "";
  } catch {
    error.value = "Failed to load metrics";
  }
}

function startPolling(): void {
  stopPolling();
  void fetchMetrics();
  intervalId = setInterval(() => void fetchMetrics(), 10_000);
}

function stopPolling(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function onToggle(event: Event): void {
  open.value = (event.target as HTMLDetailsElement).open;
}

function setSort(key: SortKey): void {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = key === "step_id";
  }
}

const sortedSteps = computed(() => {
  const key = sortKey.value;
  const asc = sortAsc.value ? 1 : -1;
  return [...steps.value].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * asc;
    }
    return ((av as number) - (bv as number)) * asc;
  });
});

const totalIn = computed(() => steps.value.reduce((s, r) => s + r.input_tokens, 0));
const totalOut = computed(() => steps.value.reduce((s, r) => s + r.output_tokens, 0));
const totalTools = computed(() =>
  steps.value.reduce((s, r) => s + r.tool_calls_count, 0),
);

function fmtMs(ms: number): string {
  if (!ms) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function fmtN(n: number): string {
  if (!n) return "—";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

watch(
  () => props.taskId,
  (id) => {
    steps.value = [];
    error.value = "";
    if (id) startPolling();
    else stopPolling();
  },
);

onMounted(() => {
  if (props.taskId) startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.step-tokens-panel__state {
  padding: 6px 0;
  color: var(--text-muted, #999);
  font-size: 0.85rem;
}

.step-tokens-panel__state--error {
  color: var(--error, #d7563f);
}

.step-tokens-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.step-tokens-table__th {
  text-align: left;
  padding: 4px 8px;
  cursor: pointer;
  user-select: none;
  color: var(--text-muted, #aaa);
  border-bottom: 1px solid var(--border, #333);
  white-space: nowrap;
}

.step-tokens-table__th:hover,
.step-tokens-table__th--active {
  color: var(--text, #f5f0e7);
}

.step-tokens-table__sort-arrow {
  font-size: 0.7rem;
  margin-left: 3px;
}

.step-tokens-table__row:nth-child(even) {
  background: color-mix(in srgb, var(--surface, #1a1a2e) 60%, transparent);
}

.step-tokens-table__td {
  padding: 4px 8px;
  color: var(--text, #f5f0e7);
  border-bottom: 1px solid color-mix(in srgb, var(--border, #333) 40%, transparent);
}

.step-tokens-table__td--name {
  font-family: monospace;
  font-size: 0.8rem;
}

.step-tokens-table__td--num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.step-tokens-table__totals .step-tokens-table__td {
  font-weight: 600;
  border-top: 1px solid var(--border, #333);
  border-bottom: none;
}
</style>
