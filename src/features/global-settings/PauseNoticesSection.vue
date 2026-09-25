<template>
  <fieldset class="pause-notices" data-test="pause-notices">
    <legend>{{ t("settings.pauseNotices.legend") }}</legend>
    <p class="hint">{{ t("settings.pauseNotices.intro") }}</p>
    <SettingPrerequisite
      v-if="!state.swarm_notify_enabled"
      pane="notifications"
      field="swarm_notify_enabled"
      :message="t('settings.pauseNotices.needsNotify')"
    />
    <SettingPrerequisite
      v-else-if="!channelConfigured"
      pane="notifications"
      field="swarm_notify_webhook_url"
      :message="t('settings.pauseNotices.needsChannel')"
    />
    <SettingPrerequisite
      v-if="!signedLinksReady"
      pane="remote-control"
      field="swarm_human_gate_enabled"
      :message="t('settings.pauseNotices.needsSignedLinks')"
    />
    <p v-if="state.swarm_notify_enabled && channelConfigured && signedLinksReady" class="hint">
      {{ t("settings.pauseNotices.ready") }}
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import SettingPrerequisite from "@/shared/components/settings-fields/SettingPrerequisite.vue";
import { signedLinksReady as signedLinksConfigured } from "@/shared/lib/global-search/prerequisites";

const { t } = useI18n();
const { state } = useGlobalSearchKeys();

const channelConfigured = computed(() =>
  [
    state.swarm_notify_webhook_url,
    state.swarm_notify_telegram_chat_id,
    state.swarm_notify_slack_webhook_url,
    state.swarm_notify_discord_webhook_url,
    state.swarm_notify_email_recipients,
  ].some((value) => value.trim() !== ""),
);
const signedLinksReady = computed(() => signedLinksConfigured(state));
</script>

<style scoped>
.pause-notices {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 10px 14px;
}
.pause-notices legend {
  font-weight: 600;
}
</style>
