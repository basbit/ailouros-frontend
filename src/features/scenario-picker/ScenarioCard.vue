<template>
  <button
    type="button"
    class="scenario-picker__card"
    :class="{ 'is-selected': selected }"
    :disabled="disabled"
    @click="$emit('pick')"
  >
    <div class="card__row">
      <span class="card__title">{{ title }}</span>
      <button
        type="button"
        class="card__star"
        :class="{ 'is-active': favorite }"
        :title="favoriteLabel"
        :disabled="disabled"
        @click="onToggleFavorite"
      >
        {{ favorite ? "★" : "☆" }}
      </button>
      <span v-if="selected" class="card__pill">{{ selectedLabel }}</span>
    </div>
    <p class="card__desc">{{ description }}</p>
    <div class="card__meta">
      <span
        class="card__badge"
        :class="
          scenario.workspace_write_default ? 'card__badge--write' : 'card__badge--read'
        "
      >
        {{ scenario.workspace_write_default ? writeOnLabel : writeOffLabel }}
      </span>
      <span class="card__badge">{{ stepsLabel }}</span>
    </div>
    <div v-if="scenario.tags.length" class="card__tags">
      <span v-for="tag in scenario.tags" :key="tag" class="card__tag">{{ tag }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { ScenarioSummary } from "@/shared/model/scenario-types";

defineProps<{
  scenario: ScenarioSummary;
  title: string;
  description: string;
  selected: boolean;
  favorite: boolean;
  disabled: boolean;
  selectedLabel: string;
  favoriteLabel: string;
  writeOnLabel: string;
  writeOffLabel: string;
  stepsLabel: string;
}>();

const emit = defineEmits<{ pick: []; "toggle-favorite": [] }>();

function onToggleFavorite(event: Event): void {
  event.stopPropagation();
  emit("toggle-favorite");
}
</script>

<style scoped>
.card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.card__title {
  font-size: 13px;
  font-weight: 600;
}
.card__desc {
  margin: 0;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  line-height: 1.4;
}
.card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.card__badge {
  font-size: 10px;
  padding: 2px 6px;
  background: color-mix(in srgb, var(--text3, #6b7280) 25%, transparent);
  border-radius: 4px;
  color: var(--text2, #a8b0c4);
}
.card__badge--write {
  background: color-mix(in srgb, #d7563f 25%, transparent);
  color: var(--text, #f5f0e7);
}
.card__badge--read {
  background: color-mix(in srgb, #3b5bdb 25%, transparent);
  color: var(--text, #f5f0e7);
}
.card__pill {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-radius: 999px;
}
.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.card__tag {
  font-size: 10px;
  padding: 1px 5px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text3, #6b7280);
}
.card__star {
  background: transparent;
  border: none;
  color: var(--text3, #6b7280);
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.card__star:hover,
.card__star.is-active {
  color: #f5b740;
}
</style>
