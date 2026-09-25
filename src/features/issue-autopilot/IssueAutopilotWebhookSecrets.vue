<template>
  <section class="autopilot__block" data-test="autopilot-webhook-secrets">
    <h2 class="autopilot__heading">{{ t("settings.autopilot.secretsTitle") }}</h2>
    <p class="hint">{{ t("settings.autopilot.secretsHint") }}</p>
    <SettingsSyncError />
    <SettingsSecretField
      field="swarm_github_webhook_secret"
      env-name="SWARM_GITHUB_WEBHOOK_SECRET"
      generatable
      reveal-generated
      :label="t('settings.autopilot.githubSecret.label')"
      :help="t('settings.autopilot.githubSecret.help')"
    />
    <SettingsSecretField
      field="swarm_linear_webhook_secret"
      env-name="SWARM_LINEAR_WEBHOOK_SECRET"
      generatable
      reveal-generated
      :label="t('settings.autopilot.linearSecret.label')"
      :help="t('settings.autopilot.linearSecret.help')"
    />
    <div class="autopilot__limits">
      <SettingsTextField
        field="swarm_linear_webhook_tolerance_seconds"
        env-name="SWARM_LINEAR_WEBHOOK_TOLERANCE_SECONDS"
        placeholder="60"
        numeric
        :min="1"
        :max="3600"
        :label="t('settings.autopilot.tolerance.label')"
        :help="t('settings.autopilot.tolerance.help')"
      />
      <SettingsTextField
        field="swarm_issue_autorun_event_log_limit"
        env-name="SWARM_ISSUE_AUTORUN_EVENT_LOG_LIMIT"
        placeholder="200"
        numeric
        :min="1"
        :max="100000"
        :label="t('settings.autopilot.eventLogLimit.label')"
        :help="t('settings.autopilot.eventLogLimit.help')"
      />
      <SettingsTextField
        field="swarm_issue_autorun_delivery_ledger_limit"
        env-name="SWARM_ISSUE_AUTORUN_DELIVERY_LEDGER_LIMIT"
        placeholder="2000"
        numeric
        :min="1"
        :max="1000000"
        :label="t('settings.autopilot.ledgerLimit.label')"
        :help="t('settings.autopilot.ledgerLimit.help')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import { MASKED_SECRET } from "@/shared/lib/global-search/secret-policy";
import SettingsSecretField from "@/shared/components/settings-fields/SettingsSecretField.vue";
import SettingsTextField from "@/shared/components/settings-fields/SettingsTextField.vue";
import SettingsSyncError from "@/shared/components/settings-fields/SettingsSyncError.vue";

const emit = defineEmits<{ saved: [] }>();

const { t } = useI18n();
const { state } = useGlobalSearchKeys();

watch(
  () => [state.swarm_github_webhook_secret, state.swarm_linear_webhook_secret],
  (next, previous) => {
    const becameSaved = next.some(
      (value, index) => value === MASKED_SECRET && previous[index] !== MASKED_SECRET,
    );
    if (becameSaved) emit("saved");
  },
);
</script>

<style scoped>
.autopilot__limits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}
</style>
