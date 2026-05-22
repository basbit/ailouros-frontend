<template>
  <div class="graph-tab">
    <WikiGraphPanel />
  </div>
</template>

<script setup lang="ts">
import WikiGraphPanel from "@/entities/wiki/WikiGraphPanel.vue";
</script>

<style scoped>
.graph-tab {
  display: flex;
  flex-direction: column;
  min-height: 480px;
  flex: 1 1 auto;
}
</style>
