<template>
  <button
    type="button"
    :class="['close-icon-button', extraClass].filter(Boolean).join(' ')"
    :aria-label="label"
    :title="title ?? label"
    @click="emit('click')"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    title?: string;
    size?: number;
    strokeWidth?: number;
    extraClass?: string;
  }>(),
  { size: 16, strokeWidth: 2, title: undefined, extraClass: undefined },
);

const emit = defineEmits<{ click: [] }>();
</script>

<style scoped>
.close-icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}
</style>
