<template>
  <section class="run-live-steps">
    <h3 class="run-live-steps__title">{{ heading }}</h3>
    <ol class="run-live-steps__list">
      <li
        v-for="(step, index) in steps"
        :key="`${step.id}-${index}`"
        class="run-live-steps__row"
        :class="`run-live-steps__row--${step.state}`"
      >
        <span class="run-live-steps__index">{{ index + 1 }}</span>
        <span class="run-live-steps__id">{{ step.id }}</span>
        <span class="run-live-steps__state">
          {{ labelFor(step.state) }}
        </span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { StepRow, StepState } from "./useRunLiveSteps";

defineProps<{
  heading: string;
  steps: StepRow[];
  labelFor: (state: StepState) => string;
}>();
</script>

<style scoped>
.run-live-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.run-live-steps__title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  margin: 0;
}

.run-live-steps__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.run-live-steps__row {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.run-live-steps__row--active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.run-live-steps__row--completed {
  border-color: color-mix(in srgb, var(--ok) 40%, transparent);
}

.run-live-steps__row--failed {
  border-color: color-mix(in srgb, var(--error) 40%, transparent);
}

.run-live-steps__index {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
  text-align: center;
}

.run-live-steps__id {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-live-steps__state {
  font-size: 10px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
</style>
