<template>
  <aside class="history-detail-sidebar">
    <PatternMemoryHint
      v-if="hint && !hintDismissed"
      :message="hintMessage"
      @apply="$emit('apply-hint')"
      @dismiss="$emit('dismiss-hint')"
    />
    <h3 class="history-detail-sidebar__title">{{ similarHeading }}</h3>
    <ul v-if="similarRuns.length" class="history-detail-sidebar__list">
      <li
        v-for="similar in similarRuns"
        :key="similar.id"
        class="history-detail-sidebar__row"
      >
        <button
          type="button"
          class="history-detail-sidebar__btn"
          @click="$emit('open-similar', similar.id)"
        >
          <span class="history-detail-sidebar__name">
            {{ previewOf(similar.prompt) }}
          </span>
          <span class="history-detail-sidebar__meta">
            {{ formatRelative(similar.startedAt ?? similar.at) }}
          </span>
        </button>
      </li>
    </ul>
    <p v-else class="history-detail-sidebar__empty">{{ emptyText }}</p>
  </aside>
</template>

<script setup lang="ts">
import PatternMemoryHint from "@/widgets/pattern-memory-hint/PatternMemoryHint.vue";
import type { HistoryEntry } from "@/shared/store/ui";

defineProps<{
  hint: unknown;
  hintDismissed: boolean;
  hintMessage: string;
  similarRuns: HistoryEntry[];
  similarHeading: string;
  emptyText: string;
  previewOf: (prompt: string) => string;
  formatRelative: (value: number | null | undefined) => string;
}>();

defineEmits<{
  "apply-hint": [];
  "dismiss-hint": [];
  "open-similar": [id: string];
}>();
</script>

<style scoped>
.history-detail-sidebar {
  min-width: 0;
  border-left: 1px solid var(--line);
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-detail-sidebar__title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin: 0;
}

.history-detail-sidebar__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-detail-sidebar__btn {
  appearance: none;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.history-detail-sidebar__btn:hover {
  border-color: var(--line);
  background: var(--card);
}

.history-detail-sidebar__name {
  display: block;
  max-width: 100%;
  font-size: 12px;
  color: var(--ink-2);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-detail-sidebar__meta {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--ink-4);
}

.history-detail-sidebar__empty {
  margin: 0;
  font-size: 12px;
  color: var(--ink-4);
}

@media (max-width: 1100px) {
  .history-detail-sidebar {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--line);
    padding-top: 16px;
  }
}
</style>
