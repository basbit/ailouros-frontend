<template>
  <fieldset class="remote-section">
    <legend>{{ t("remoteControl.bot.legend") }}</legend>
    <p class="hint">{{ t("remoteControl.bot.intro") }}</p>
    <TelegramStatusBadge :status="telegram.status.value" :load-error="telegram.error.value" />
    <SettingsToggleField
      field="swarm_telegram_ingress_enabled"
      env-name="SWARM_TELEGRAM_INGRESS_ENABLED"
      :label="t('remoteControl.bot.enabled.label')"
      :help="t('remoteControl.bot.enabled.help')"
    />
    <SettingsSecretField
      field="swarm_telegram_ingress_bot_token"
      env-name="SWARM_TELEGRAM_INGRESS_BOT_TOKEN"
      placeholder="123456:ABC-DEF…"
      :label="t('remoteControl.bot.token.label')"
      :help="t('remoteControl.bot.token.help')"
    />
    <SettingsTextField
      field="swarm_telegram_ingress_allowed_chat_ids"
      env-name="SWARM_TELEGRAM_INGRESS_ALLOWED_CHAT_IDS"
      placeholder="123456789, -100987654321"
      :label="t('remoteControl.bot.allowed.label')"
      :help="t('remoteControl.bot.allowed.help')"
    />
    <div class="remote-section__row">
      <SettingsTextField
        field="swarm_telegram_ingress_max_per_minute"
        env-name="SWARM_TELEGRAM_INGRESS_MAX_PER_MINUTE"
        placeholder="30"
        numeric
        :min="1"
        :max="600"
        :label="t('remoteControl.bot.perMinute.label')"
        :help="t('remoteControl.bot.perMinute.help')"
      />
      <SettingsTextField
        field="swarm_telegram_ingress_max_per_hour"
        env-name="SWARM_TELEGRAM_INGRESS_MAX_PER_HOUR"
        placeholder="200"
        numeric
        :min="1"
        :max="10000"
        :label="t('remoteControl.bot.perHour.label')"
        :help="t('remoteControl.bot.perHour.help')"
      />
      <SettingsTextField
        field="swarm_telegram_ingress_poll_timeout_seconds"
        env-name="SWARM_TELEGRAM_INGRESS_POLL_TIMEOUT_SECONDS"
        placeholder="25"
        numeric
        :min="1"
        :max="60"
        :label="t('remoteControl.bot.pollTimeout.label')"
        :help="t('remoteControl.bot.pollTimeout.help')"
      />
    </div>
    <SettingsToggleField
      field="swarm_telegram_ingress_cancel_enabled"
      env-name="SWARM_TELEGRAM_INGRESS_CANCEL_ENABLED"
      :label="t('remoteControl.bot.cancel.label')"
      :help="t('remoteControl.bot.cancel.help')"
    />
    <SettingPrerequisite
      v-if="state.swarm_telegram_ingress_cancel_enabled && !signedLinksReady(state)"
      pane="remote-control"
      field="swarm_human_gate_enabled"
      :message="t('remoteControl.bot.cancel.needsSignedLinks')"
    />
    <SettingsTextField
      field="swarm_telegram_ingress_cancel_link_ttl_seconds"
      env-name="SWARM_TELEGRAM_INGRESS_CANCEL_LINK_TTL_SECONDS"
      placeholder="300"
      numeric
      :min="30"
      :max="86400"
      :label="t('remoteControl.bot.cancelTtl.label')"
      :help="t('remoteControl.bot.cancelTtl.help')"
    />
  </fieldset>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import SettingsToggleField from "@/shared/components/settings-fields/SettingsToggleField.vue";
import SettingsTextField from "@/shared/components/settings-fields/SettingsTextField.vue";
import SettingsSecretField from "@/shared/components/settings-fields/SettingsSecretField.vue";
import SettingPrerequisite from "@/shared/components/settings-fields/SettingPrerequisite.vue";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import { signedLinksReady } from "@/shared/lib/global-search/prerequisites";
import TelegramStatusBadge from "./TelegramStatusBadge.vue";
import { useTelegramIngressStatus } from "./useTelegramIngressStatus";

const { t } = useI18n();
const { state } = useGlobalSearchKeys();
const telegram = useTelegramIngressStatus();
</script>
