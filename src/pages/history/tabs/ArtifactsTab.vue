<template>
  <div class="artifacts-tab">
    <p class="artifacts-tab__placeholder">
      {{ taskId ? taskId : "—" }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  taskId: string | null | undefined;
}>();
</script>

<style scoped>
.artifacts-tab {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.artifacts-tab__placeholder {
  margin: 0;
  font-size: 12px;
  color: var(--ink-4);
}
</style>
