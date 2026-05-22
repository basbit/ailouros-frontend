<template>
  <section class="notifications-pane">
    <PaneHeader
      :title="t('settings.notifications.title')"
      :subtitle="t('settings.notifications.subtitle')"
    />
    <div class="notifications-pane__card">
      <GlobalNotificationSettings />
    </div>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import GlobalNotificationSettings from "@/features/global-settings/GlobalNotificationSettings.vue";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
</script>

<style scoped>
.notifications-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}

.notifications-pane__card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
}
</style>
