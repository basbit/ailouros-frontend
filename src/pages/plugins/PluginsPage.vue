<template>
  <div class="plugins-page">
    <header class="plugins-page__head">
      <button type="button" class="plugins-page__back" @click="goBack">← Back</button>
      <h1 class="plugins-page__title">Plugins</h1>
    </header>
    <PluginsMarketplacePanel class="plugins-page__panel" />
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from "vue";
import PluginsMarketplacePanel from "@/widgets/plugins-marketplace/PluginsMarketplacePanel.vue";

type AppView = "main" | "agent-editor" | "plugins";

const activeView = inject<Ref<AppView>>("activeView");

function goBack(): void {
  if (activeView) activeView.value = "main";
}
</script>

<style scoped>
.plugins-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg, #fff);
}
.plugins-page__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #e2e2e6);
}
.plugins-page__back {
  background: transparent;
  border: 1px solid var(--border, #ccc);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text, #333);
}
.plugins-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.plugins-page__panel {
  flex: 1;
  min-height: 0;
}
</style>
