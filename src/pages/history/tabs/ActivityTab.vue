<template>
  <div class="activity-tab">
    <ToolActivityPanel :task-id="taskId" />
  </div>
</template>

<script setup lang="ts">
import { ToolActivityPanel } from "@/widgets/tool-activity-panel";

defineProps<{
  taskId: string | null;
}>();
</script>

<style scoped>
.activity-tab {
  display: flex;
  flex-direction: column;
}
</style>
