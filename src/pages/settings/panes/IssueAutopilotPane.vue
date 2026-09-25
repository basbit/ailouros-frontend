<template>
  <section class="autopilot-pane">
    <PaneHeader
      :title="t('settings.autopilot.title')"
      :subtitle="t('settings.autopilot.subtitle')"
    />
    <div class="autopilot-pane__card">
      <IssueAutopilotPanel />
    </div>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { IssueAutopilotPanel } from "@/features/issue-autopilot";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
</script>

<style scoped>
.autopilot-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 960px;
}

.autopilot-pane__card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
}
</style>
