<template>
  <section class="run-live-log">
    <div class="run-live-log__toolbar">
      <button
        v-for="option in filterOptions"
        :key="option.key"
        type="button"
        class="run-live-log__filter"
        :class="{ 'run-live-log__filter--active': filter === option.key }"
        @click="$emit('update:filter', option.key)"
      >
        {{ option.label }}
      </button>
    </div>
    <ol v-if="events.length" class="run-live-log__list">
      <li
        v-for="(event, index) in events"
        :key="event.id ?? `${event.timestamp ?? ''}-${index}`"
        class="run-live-log__line"
        :class="`run-live-log__line--${classify(event)}`"
      >
        <span class="run-live-log__time">
          {{ formatTime(event.timestamp) }}
        </span>
        <span class="run-live-log__agent">
          {{ event.agent ?? "—" }}
        </span>
        <CitationText class="run-live-log__message" :text="event.message ?? ''" />
      </li>
    </ol>
    <p v-else class="run-live-log__empty">{{ emptyText }}</p>
  </section>
</template>

<script setup lang="ts">
import CitationText from "@/features/inline-citations/CitationText.vue";

import type { EventRow, LogClass, LogFilter } from "./useRunLiveSteps";

defineProps<{
  filter: LogFilter;
  filterOptions: Array<{ key: LogFilter; label: string }>;
  events: EventRow[];
  emptyText: string;
  classify: (event: EventRow) => LogClass;
  formatTime: (timestamp: string | undefined) => string;
}>();

defineEmits<{ "update:filter": [filter: LogFilter] }>();
</script>

<style scoped>
.run-live-log {
  --run-live-log-longest-role-width: 108px;
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  color: var(--ink);
  border-radius: var(--r-md);
  overflow: hidden;
  min-width: 0;
  /* Cap the terminal panel so long runs scroll inside it instead of
     stretching the page; the grid row still matches the steps column when
     the log is shorter. The 320px floor keeps it usable in tiny viewports. */
  max-height: clamp(320px, 70vh, 640px);
}

.run-live-log__toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
}

.run-live-log__filter {
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

.run-live-log__filter:hover {
  color: var(--ink);
}

.run-live-log__filter--active {
  background: var(--accent-soft);
  color: var(--accent);
}

.run-live-log__list {
  list-style: none;
  margin: 0;
  padding: 8px 12px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 11.5px;
  line-height: 1.55;
  flex: 1 1 auto;
}

.run-live-log__line {
  display: grid;
  grid-template-columns: 80px var(--run-live-log-longest-role-width) 1fr;
  gap: 8px;
  padding: 2px 0;
}

.run-live-log__time {
  color: var(--ink-4);
}

.run-live-log__agent {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
  overflow-wrap: anywhere;
  min-width: 0;
}

.run-live-log__message {
  white-space: pre-wrap;
  word-break: break-word;
}

.run-live-log__line--sys .run-live-log__agent {
  color: var(--accent);
}

.run-live-log__line--agent .run-live-log__agent {
  color: var(--ok);
}

.run-live-log__line--rev .run-live-log__agent {
  color: var(--review);
}

.run-live-log__line--tool .run-live-log__agent {
  color: var(--info);
}

.run-live-log__line--error .run-live-log__message {
  color: var(--error);
}

.run-live-log__empty {
  margin: 0;
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-4);
}
</style>
