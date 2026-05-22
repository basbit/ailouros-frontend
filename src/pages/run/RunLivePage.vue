<template>
  <div class="run-live">
    <AppHeaderContainer />
    <main class="run-live__body">
      <RunLiveBody />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import RunLiveBody from "./RunLiveBody.vue";
import { useUiStore } from "@/shared/store/ui";
import { useRunLiveSubscription } from "./useRunLiveSubscription";

const ui = useUiStore();
useRunLiveSubscription(ui);
</script>

<style scoped>
.run-live {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.run-live__body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
