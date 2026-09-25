<template>
  <section class="agentic-pane">
    <PaneHeader
      :title="t('settings.agentic.title')"
      :subtitle="t('settings.agentic.subtitle')"
    />
    <div class="agentic-pane__card">
      <AgenticSettings />
    </div>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { AgenticSettings } from "@/features/agentic-settings";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
</script>

<style scoped>
.agentic-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 820px;
}

.agentic-pane__card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
}
</style>
