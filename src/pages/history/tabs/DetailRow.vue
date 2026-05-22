<template>
  <div class="detail-row">
    <span class="detail-row__label">{{ label }}</span>
    <span
      class="detail-row__value"
      :class="{
        'detail-row__value--mono': mono,
        'detail-row__value--multiline': multiline,
        'detail-row__value--error': emphasis === 'error',
      }"
    >
      {{ value }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
  emphasis?: "error";
}>();
</script>

<style scoped>
.detail-row {
  display: grid;
  grid-template-columns: 180px 1fr;
  align-items: baseline;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.detail-row__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}

.detail-row__value {
  font-size: 13px;
  color: var(--ink);
  word-break: break-word;
}

.detail-row__value--mono {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink-2);
}

.detail-row__value--multiline {
  white-space: pre-wrap;
}

.detail-row__value--error {
  color: var(--error);
}
</style>
