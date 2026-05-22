<template>
  <div class="run-tab">
    <RunLiveBody hide-header />
  </div>
</template>

<script setup lang="ts">
import RunLiveBody from "@/pages/run/RunLiveBody.vue";
</script>

<style scoped>
.run-tab {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
