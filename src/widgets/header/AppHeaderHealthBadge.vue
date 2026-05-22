<template>
  <button
    type="button"
    class="theme-toggle header-health"
    :class="`header-health--${normalized}`"
    :title="title"
    :aria-label="title"
    @click="$emit('open')"
  >
    <span class="header-health-dot" :class="`header-health-dot--${normalized}`"></span>
    <span class="header-health-text">{{ normalized.toUpperCase() }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  status: string | null | undefined;
}>();

defineEmits<{ open: [] }>();

const normalized = computed(() => props.status ?? "unknown");
const title = computed(() => `System health: ${normalized.value}`);
</script>

<style scoped>
.header-health {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 10px;
}
.header-health-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text3);
}
.header-health-dot--ok {
  background: var(--success, #4ade80);
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.7);
}
.header-health-dot--degraded {
  background: #f0b849;
  box-shadow: 0 0 6px rgba(240, 184, 73, 0.7);
}
.header-health-dot--error {
  background: var(--danger, #f87171);
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.7);
}
.header-health-dot--disabled,
.header-health-dot--unknown {
  background: var(--text3);
}
.header-health-text {
  font-size: 10px;
  color: var(--text2);
}
.header-health--ok {
  border-color: rgba(74, 222, 128, 0.4);
}
.header-health--degraded {
  border-color: rgba(240, 184, 73, 0.4);
}
.header-health--error {
  border-color: rgba(248, 113, 113, 0.4);
}
</style>
