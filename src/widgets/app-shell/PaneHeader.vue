<template>
  <header class="pane-header">
    <div class="pane-header__title-row">
      <h1 class="pane-header__title">{{ title }}</h1>
      <span v-if="subtitle" class="pane-header__subtitle">{{ subtitle }}</span>
    </div>
    <div class="pane-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<style scoped>
.pane-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 20px;
}

.pane-header__title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.pane-header__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 0;
}

.pane-header__subtitle {
  font-size: 13px;
  color: var(--ink-3);
}

.pane-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
