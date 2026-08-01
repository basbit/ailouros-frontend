<template>
  <section class="run-step-log">
    <div class="run-step-log__toolbar">
      <button
        v-for="option in filterOptions"
        :key="option.key"
        type="button"
        class="run-step-log__filter"
        :class="{ 'run-step-log__filter--active': filter === option.key }"
        @click="$emit('update:filter', option.key)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="visibleGroups.length" class="run-step-log__groups">
      <details
        v-for="group in visibleGroups"
        :key="group.id"
        class="run-step-log__group"
        :class="`run-step-log__group--${group.state}`"
        :open="isOpen(group)"
        @toggle="onToggle(group, $event)"
      >
        <summary class="run-step-log__summary">
          <span class="run-step-log__caret" aria-hidden="true">▸</span>
          <span
            class="run-step-log__dot"
            :class="`run-step-log__dot--${group.state}`"
          />
          <span class="run-step-log__name">{{ group.label }}</span>
          <span class="run-step-log__meta">
            <span v-if="group.durationMs != null" class="run-step-log__dur">
              {{ formatDuration(group.durationMs) }}
            </span>
            <span class="run-step-log__count">{{ group.events.length }}</span>
          </span>
        </summary>
        <ol v-if="group.events.length" class="run-step-log__list">
          <li
            v-for="(event, index) in group.events"
            :key="event.id ?? `${event.timestamp ?? ''}-${index}`"
            class="run-step-log__line"
            :class="`run-step-log__line--${classify(event)}`"
          >
            <span class="run-step-log__time">{{ formatTime(event.timestamp) }}</span>
            <CitationText class="run-step-log__message" :text="event.message ?? ''" />
          </li>
        </ol>
        <p v-else class="run-step-log__group-empty">{{ emptyStepText }}</p>
      </details>
    </div>
    <p v-else class="run-step-log__empty">{{ emptyText }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import CitationText from "@/features/inline-citations/CitationText.vue";

import type { EventRow, LogClass, LogFilter, StepLogGroup } from "./useRunLiveSteps";

const props = defineProps<{
  filter: LogFilter;
  filterOptions: Array<{ key: LogFilter; label: string }>;
  groups: StepLogGroup[];
  emptyText: string;
  emptyStepText: string;
  classify: (event: EventRow) => LogClass;
  formatTime: (timestamp: string | undefined) => string;
}>();

defineEmits<{ "update:filter": [filter: LogFilter] }>();

// Only show steps that produced output (or the active/failed one); collapse the
// pipeline that has not run yet so a 21-step run is not a wall of empty rows.
const visibleGroups = computed(() =>
  props.groups.filter(
    (group) =>
      group.events.length > 0 || group.state === "active" || group.state === "failed",
  ),
);

// Per-group open state. Users can toggle freely; we only seed defaults.
const openState = reactive<Record<string, boolean>>({});

function isOpen(group: StepLogGroup): boolean {
  if (group.id in openState) return openState[group.id];
  // Default: expand the running / failed step so its output is visible; keep the
  // rest collapsed for a compact per-step overview.
  return group.state === "active" || group.state === "failed";
}

function onToggle(group: StepLogGroup, event: Event): void {
  openState[group.id] = (event.target as HTMLDetailsElement).open;
}

// When a new step becomes active, auto-expand it once (unless the user already
// set it), and collapse steps that just completed to keep the view tidy.
watch(
  () => props.groups.map((group) => `${group.id}:${group.state}`).join("|"),
  () => {
    for (const group of props.groups) {
      if (group.state === "active" && !(group.id in openState)) {
        openState[group.id] = true;
      }
    }
  },
);

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
</script>

<style scoped>
.run-step-log {
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  color: var(--ink);
  border-radius: var(--r-md);
  overflow: hidden;
  min-width: 0;
  max-height: clamp(320px, 70vh, 640px);
}

.run-step-log__toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
}

.run-step-log__filter {
  appearance: none;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink-3);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.run-step-log__filter:hover {
  color: var(--ink);
}

.run-step-log__filter--active {
  background: var(--accent-soft);
  color: var(--accent);
}

.run-step-log__groups {
  overflow-y: auto;
  flex: 1 1 auto;
  padding: 6px 8px;
}

.run-step-log__group {
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  margin-bottom: 6px;
  background: var(--card);
  overflow: hidden;
}

.run-step-log__summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.run-step-log__summary::-webkit-details-marker {
  display: none;
}

.run-step-log__caret {
  color: var(--ink-4);
  font-size: 10px;
  transition: transform 0.12s ease;
}

.run-step-log__group[open] .run-step-log__caret {
  transform: rotate(90deg);
}

.run-step-log__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink-4);
  flex: none;
}

.run-step-log__dot--active {
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.run-step-log__dot--completed {
  background: var(--ok);
}

.run-step-log__dot--failed {
  background: var(--error);
}

.run-step-log__dot--system {
  background: var(--info, var(--accent));
}

.run-step-log__name {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
  overflow-wrap: anywhere;
  min-width: 0;
}

.run-step-log__meta {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ink-4);
  flex: none;
}

.run-step-log__dur {
  font-variant-numeric: tabular-nums;
}

.run-step-log__count {
  min-width: 18px;
  text-align: center;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--bg-2);
  color: var(--ink-3);
}

.run-step-log__list {
  list-style: none;
  margin: 0;
  padding: 4px 12px 10px 30px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  line-height: 1.55;
  border-top: 1px solid var(--line);
}

.run-step-log__line {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  padding: 2px 0;
}

.run-step-log__time {
  color: var(--ink-4);
}

.run-step-log__message {
  white-space: pre-wrap;
  word-break: break-word;
}

.run-step-log__line--rev .run-step-log__message {
  color: var(--review, var(--ink));
}

.run-step-log__line--tool .run-step-log__message {
  color: var(--info, var(--ink));
}

.run-step-log__line--error .run-step-log__message {
  color: var(--error);
}

.run-step-log__group-empty,
.run-step-log__empty {
  margin: 0;
  padding: 10px 30px;
  font-size: 11.5px;
  color: var(--ink-4);
}

.run-step-log__empty {
  padding: 24px;
  text-align: center;
  font-size: 12px;
}
</style>
