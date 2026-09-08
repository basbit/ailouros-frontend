<template>
  <section class="trace-timeline" :aria-label="t('traceTimeline.cardAria')">
    <header class="trace-timeline__header">
      <h3 class="trace-timeline__title">{{ t("traceTimeline.title") }}</h3>
      <button
        type="button"
        class="trace-timeline__btn"
        :disabled="loading || !taskId.trim()"
        @click="refresh"
      >
        {{ loading ? t("traceTimeline.refreshing") : t("traceTimeline.refresh") }}
      </button>
    </header>

    <p v-if="!taskId.trim()" class="trace-timeline__hint">
      {{ t("traceTimeline.noTask") }}
    </p>
    <p v-else-if="lastError" class="trace-timeline__error">{{ lastError }}</p>
    <p v-else-if="!storeLoaded" class="trace-timeline__hint">
      {{ t("traceTimeline.empty") }}
    </p>
    <p v-else-if="isEmpty" class="trace-timeline__hint">
      {{ t("traceTimeline.noEvents") }}
    </p>

    <ol v-else class="trace-timeline__list">
      <li
        v-for="(item, index) in items"
        :key="item.eventId"
        class="trace-timeline__item"
        :class="{ 'trace-timeline__item--nested': isNested(item) }"
      >
        <span class="trace-timeline__badge" :class="badgeClass(item.eventType)">
          {{ item.eventType }}
        </span>
        <span class="trace-timeline__step">{{ item.step }}</span>
        <span v-if="item.startTs" class="trace-timeline__ms">
          {{ ((item.startTs ?? 0) / 1000).toFixed(0) }}ms
        </span>
        <span v-if="durationFor(index, item) !== null" class="trace-timeline__dur">
          {{ item.eventType.replace("_", " ") }} {{ durationFor(index, item) }}
        </span>
        <template v-for="promptFile in item.promptFiles" :key="promptFile">
          <a
            class="trace-timeline__link"
            :href="promptFile"
            target="_blank"
            rel="noreferrer"
          >
            {{ t("traceTimeline.prompt") }}
          </a>
        </template>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useTaskTrace } from "@/features/task-trace/useTaskTrace";
import type { TraceEventItem } from "@/shared/api/endpoints/trace";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ taskId: string }>();

const { t } = useI18n();
const store = useTaskTrace();

const trace = computed(() => store.trace.value);
const loading = computed(() => store.loading.value);
const lastError = computed(() => store.lastError.value);

const isEmpty = computed(() => !trace.value || trace.value.events.length === 0);
const storeLoaded = computed(() => !loading.value && !lastError.value);

interface TimelineItem {
  eventId: string;
  eventType: string;
  step: string;
  timestamp: string;
  parentEventId: string | null;
  startTs: number | null;
  endTs: number | null;
  promptFiles: string[];
}

const items = computed<TimelineItem[]>(() => {
  const events = trace.value?.events ?? [];
  const byId = new Map<string, TraceEventItem>();
  for (const event of events) byId.set(event.eventId, event);
  return events.map((event) => {
    const isStart = event.eventType.endsWith("_start");
    const isEnd = event.eventType.endsWith("_end");
    const ts = Date.parse(event.timestamp);
    const startTs = isStart && !Number.isNaN(ts) ? ts : null;
    const endTs = isEnd && !Number.isNaN(ts) ? ts : null;
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      step: event.step,
      timestamp: event.timestamp,
      parentEventId: event.parentEventId,
      startTs,
      endTs,
      promptFiles: [...event.promptFiles],
    };
  });
});

function isNested(item: TimelineItem): boolean {
  return item.parentEventId !== null;
}

function badgeClass(eventType: string): string {
  if (eventType === "error") return "trace-timeline__badge--error";
  if (eventType === "human_approval" || eventType === "gate_open") {
    return "trace-timeline__badge--gate";
  }
  if (eventType === "tool_call") return "trace-timeline__badge--tool";
  return "trace-timeline__badge--plain";
}

function durationFor(index: number, item: TimelineItem): number | null {
  const start = item.startTs;
  if (start === null) return null;
  const events = items.value;
  for (let i = index + 1; i < events.length; i += 1) {
    const end = events[i].endTs;
    if (events[i].step === item.step && end !== null) {
      return end - start;
    }
  }
  return null;
}

function refresh(): void {
  void store.refresh(props.taskId);
}

onMounted(() => {
  if (props.taskId.trim()) {
    void store.refresh(props.taskId);
  }
});
</script>

<style scoped>
.trace-timeline {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trace-timeline__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.trace-timeline__title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.trace-timeline__btn {
  appearance: none;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 3px 9px;
  font-size: 12px;
  cursor: pointer;
}

.trace-timeline__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.trace-timeline__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.trace-timeline__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.trace-timeline__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trace-timeline__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-2);
}

.trace-timeline__item--nested {
  padding-left: 22px;
}

.trace-timeline__badge {
  padding: 1px 7px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
}

.trace-timeline__badge--plain {
  color: var(--ink-3);
  background: color-mix(in srgb, var(--ink-3) 12%, transparent);
}

.trace-timeline__badge--error {
  color: var(--error);
  background: color-mix(in srgb, var(--error) 14%, transparent);
}

.trace-timeline__badge--gate {
  color: var(--warn, #d9a441);
  background: color-mix(in srgb, var(--warn, #d9a441) 14%, transparent);
}

.trace-timeline__badge--tool {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

.trace-timeline__step {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.trace-timeline__ms,
.trace-timeline__dur {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.trace-timeline__link {
  font-size: 11px;
  color: var(--accent);
  text-decoration: none;
}

.trace-timeline__link:hover {
  text-decoration: underline;
}
</style>
