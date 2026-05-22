<template>
  <aside class="glimpse">
    <header class="glimpse__header">
      <h3 class="glimpse__title">{{ t("runIdle.historyHeading") }}</h3>
      <button
        v-if="items.length"
        type="button"
        class="glimpse__all"
        @click="emit('open-all')"
      >
        {{ t("runIdle.historyAll", { count: items.length }) }}
      </button>
    </header>
    <ul v-if="items.length" class="glimpse__list">
      <li v-for="entry in displayed" :key="entry.id" class="glimpse__item">
        <button type="button" class="glimpse__row" @click="emit('select', entry.id)">
          <span
            class="glimpse__status"
            :class="`glimpse__status--${entry.status}`"
            aria-hidden="true"
          />
          <span class="glimpse__row-body">
            <span class="glimpse__row-title">{{ entry.title }}</span>
            <span class="glimpse__row-meta">
              <span>{{ entry.timestamp }}</span>
              <span v-if="entry.duration">· {{ entry.duration }}</span>
              <span v-if="entry.stepCount !== undefined">· {{ entry.stepCount }} </span>
            </span>
          </span>
        </button>
      </li>
    </ul>
    <p v-else class="glimpse__empty">{{ t("runIdle.historyEmpty") }}</p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";

export interface HistoryGlimpseEntry {
  id: string;
  title: string;
  status: "ok" | "fail" | "warn" | "run";
  timestamp: string;
  duration?: string;
  stepCount?: number;
}

const props = defineProps<{
  items: HistoryGlimpseEntry[];
  limit?: number;
}>();

const emit = defineEmits<{
  select: [id: string];
  "open-all": [];
}>();

const { t } = useI18n();

const displayed = computed(() => props.items.slice(0, props.limit ?? 6));
</script>

<style scoped>
.glimpse {
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--line);
  background: var(--bg-2);
  height: 100%;
  min-width: 0;
}

.glimpse__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 18px 20px 12px;
}

.glimpse__title {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-sans);
  color: var(--ink);
  margin: 0;
}

.glimpse__all {
  appearance: none;
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--accent-2);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--r-sm);
}

.glimpse__all:hover {
  background: var(--card);
}

.glimpse__list {
  list-style: none;
  margin: 0;
  padding: 0 12px 12px;
  overflow-y: auto;
  flex: 1;
}

.glimpse__item + .glimpse__item {
  margin-top: 2px;
}

.glimpse__row {
  width: 100%;
  appearance: none;
  background: transparent;
  border: none;
  border-radius: var(--r-md);
  padding: 10px 12px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  color: inherit;
}

.glimpse__row:hover {
  background: var(--card);
}

.glimpse__status {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 5px;
  background: var(--ink-4);
  flex-shrink: 0;
}

.glimpse__status--ok {
  background: var(--ok);
}

.glimpse__status--fail {
  background: var(--error);
}

.glimpse__status--warn {
  background: var(--warn);
}

.glimpse__status--run {
  background: var(--accent);
  animation: glimpse-pulse 1.4s ease-in-out infinite;
}

.glimpse__row-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.glimpse__row-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.glimpse__row-meta {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: var(--ink-4);
  font-family: var(--font-mono);
}

.glimpse__empty {
  margin: 0;
  padding: 0 20px 16px;
  font-size: 12px;
  color: var(--ink-4);
}

@keyframes glimpse-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
