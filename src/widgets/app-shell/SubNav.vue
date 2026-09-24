<template>
  <nav class="sub-nav" :aria-label="label">
    <button
      v-for="entry in entries"
      :key="entry.key"
      type="button"
      class="sub-nav__item"
      :class="{ 'sub-nav__item--active': entry.key === active }"
      @click="emit('select', entry.key)"
    >
      <span class="sub-nav__label">{{ entry.label }}</span>
      <!-- The space belongs to the text: without it the button's accessible
           name reads "Aboutv3" instead of "About v3". -->
      <span v-if="entry.hint" class="sub-nav__hint">{{ " " + entry.hint }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
export interface SubNavEntry {
  key: string;
  label: string;
  hint?: string;
}

defineProps<{
  entries: SubNavEntry[];
  active: string;
  label: string;
}>();

const emit = defineEmits<{
  select: [key: string];
}>();
</script>

<style scoped>
.sub-nav {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 12px;
  border-right: 1px solid var(--line);
  background: var(--card-soft);
  overflow-y: auto;
}

/* Stacked under the header on narrow viewports: a horizontal, scrollable row
   of panes instead of a rail that eats the content column. */
@media (max-width: 760px) {
  .sub-nav {
    flex: 0 0 auto;
    flex-direction: row;
    gap: 6px;
    padding: 10px 12px;
    border-right: none;
    border-bottom: 1px solid var(--line);
    overflow-x: auto;
    overflow-y: hidden;
  }

  .sub-nav__item {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

.sub-nav__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--r-md);
  background: transparent;
  border: 1px solid transparent;
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.14s,
    color 0.14s,
    border-color 0.14s;
}

.sub-nav__item:hover {
  background: var(--card);
  color: var(--ink);
}

.sub-nav__item--active {
  background: var(--card);
  color: var(--ink);
  border-color: var(--line-strong);
}

.sub-nav__hint {
  font-size: 11px;
  color: var(--ink-4);
  font-family: var(--font-mono);
}
</style>
