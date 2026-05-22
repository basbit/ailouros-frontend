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
        <span class="run-live-log__message">{{ event.message ?? "" }}</span>
      </li>
    </ol>
    <p v-else class="run-live-log__empty">{{ emptyText }}</p>
  </section>
</template>

<script setup lang="ts">
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
  display: flex;
  flex-direction: column;
  background: #15120e;
  color: #f3ece0;
  border-radius: var(--r-md);
  overflow: hidden;
  min-width: 0;
}

.run-live-log__toolbar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 235, 200, 0.12);
}

.run-live-log__filter {
  appearance: none;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(243, 236, 224, 0.6);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.run-live-log__filter:hover {
  color: rgba(243, 236, 224, 0.9);
}

.run-live-log__filter--active {
  background: rgba(225, 106, 58, 0.22);
  color: #f08454;
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
  grid-template-columns: 80px 80px 1fr;
  gap: 8px;
  padding: 2px 0;
}

.run-live-log__time {
  color: rgba(243, 236, 224, 0.45);
}

.run-live-log__agent {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(243, 236, 224, 0.65);
}

.run-live-log__message {
  white-space: pre-wrap;
  word-break: break-word;
}

.run-live-log__line--sys .run-live-log__agent {
  color: #f08454;
}

.run-live-log__line--agent .run-live-log__agent {
  color: #87c884;
}

.run-live-log__line--rev .run-live-log__agent {
  color: #b69be0;
}

.run-live-log__line--tool .run-live-log__agent {
  color: #79a4d4;
}

.run-live-log__line--error .run-live-log__message {
  color: #f08454;
}

.run-live-log__empty {
  margin: 0;
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: rgba(243, 236, 224, 0.45);
}
</style>
