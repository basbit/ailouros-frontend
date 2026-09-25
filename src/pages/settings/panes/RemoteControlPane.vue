<template>
  <section class="remote-control-pane">
    <PaneHeader
      :title="t('settings.remoteControl.title')"
      :subtitle="t('settings.remoteControl.subtitle')"
    />
    <div class="remote-control-pane__card">
      <RemoteControlSettings />
    </div>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { RemoteControlSettings } from "@/features/remote-control";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
</script>

<style scoped>
.remote-control-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 820px;
}

.remote-control-pane__card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
}
</style>
