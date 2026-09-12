<template>
  <div class="run-page-layout">
    <AppHeaderContainer />
    <main class="run-page-layout__main">
      <PipelineGridView />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PipelineGridView from "./PipelineGridView.vue";
</script>

<style scoped>
.run-page-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  padding-top: var(--hdr-h);
  background: var(--bg);
  color: var(--ink);
}

.run-page-layout__main {
  flex: 1;
  min-height: 0;
  display: flex;
  background: var(--bg);
  color: var(--ink);
}
</style>
