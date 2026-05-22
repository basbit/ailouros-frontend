<template>
  <section class="automation-pane">
    <PaneHeader
      :title="t('settings.automation.title')"
      :subtitle="t('settings.automation.subtitle')"
    />
    <div class="automation-pane__card">
      <GlobalAutomationSettings
        :remote-api-provider="settings.form.remote_api_provider"
        :remote-api-key="settings.form.remote_api_key"
        :remote-api-base-url="settings.form.remote_api_base_url"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import GlobalAutomationSettings from "@/features/global-settings/GlobalAutomationSettings.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();
</script>

<style scoped>
.automation-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}

.automation-pane__card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
}
</style>
