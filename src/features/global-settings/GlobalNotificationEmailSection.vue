<template>
  <fieldset class="notify-channel">
    <legend>{{ t("notify.email.legend") }}</legend>
    <div class="notify-row">
      <div class="field">
        <label for="global_swarm_notify_smtp_host">{{
          t("notify.email.hostLabel")
        }}</label>
        <input
          id="global_swarm_notify_smtp_host"
          type="text"
          placeholder="smtp.example.com"
          :value="state.swarm_notify_smtp_host"
          @input="
            setKey('swarm_notify_smtp_host', ($event.target as HTMLInputElement).value)
          "
        />
        <div class="hint"><code>SWARM_NOTIFY_SMTP_HOST</code><SettingSourceNote field="swarm_notify_smtp_host" /></div>
      </div>
      <div class="field">
        <label for="global_swarm_notify_smtp_port">{{
          t("notify.email.portLabel")
        }}</label>
        <input
          id="global_swarm_notify_smtp_port"
          type="number"
          min="1"
          placeholder="587"
          :value="state.swarm_notify_smtp_port"
          @input="
            setKey('swarm_notify_smtp_port', ($event.target as HTMLInputElement).value)
          "
        />
        <div class="hint"><code>SWARM_NOTIFY_SMTP_PORT</code><SettingSourceNote field="swarm_notify_smtp_port" /></div>
      </div>
    </div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="global_swarm_notify_smtp_tls"
          type="checkbox"
          :checked="state.swarm_notify_smtp_tls"
          @change="
            setKey('swarm_notify_smtp_tls', ($event.target as HTMLInputElement).checked)
          "
        />
        <span class="check-label">{{ t("notify.email.tlsLabel") }}</span>
      </label>
      <div class="hint"><code>SWARM_NOTIFY_SMTP_TLS</code><SettingSourceNote field="swarm_notify_smtp_tls" /></div>
    </div>
    <div class="field">
      <label for="global_swarm_notify_email_sender">{{
        t("notify.email.senderLabel")
      }}</label>
      <input
        id="global_swarm_notify_email_sender"
        type="email"
        :value="state.swarm_notify_email_sender"
        placeholder="bot@example.com"
        @input="
          setKey('swarm_notify_email_sender', ($event.target as HTMLInputElement).value)
        "
      />
      <div class="hint"><code>SWARM_NOTIFY_EMAIL_SENDER</code><SettingSourceNote field="swarm_notify_email_sender" /></div>
    </div>
    <div class="field">
      <label for="global_swarm_notify_email_recipients">{{
        t("notify.email.recipientsLabel")
      }}</label>
      <input
        id="global_swarm_notify_email_recipients"
        type="text"
        :value="state.swarm_notify_email_recipients"
        placeholder="alice@example.com, bob@example.com"
        @input="
          setKey(
            'swarm_notify_email_recipients',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">
        <code>SWARM_NOTIFY_EMAIL_RECIPIENTS</code><SettingSourceNote field="swarm_notify_email_recipients" />
      </div>
    </div>
    <div class="notify-row">
      <div class="field">
        <label for="global_swarm_notify_smtp_user">{{
          t("notify.email.userLabel")
        }}</label>
        <input
          id="global_swarm_notify_smtp_user"
          type="text"
          :value="state.swarm_notify_smtp_user"
          autocomplete="off"
          @input="
            setKey('swarm_notify_smtp_user', ($event.target as HTMLInputElement).value)
          "
        />
        <div class="hint"><code>SWARM_NOTIFY_SMTP_USER</code><SettingSourceNote field="swarm_notify_smtp_user" /></div>
      </div>
      <div class="field">
        <label for="global_swarm_notify_smtp_password">{{
          t("notify.email.passwordLabel")
        }}</label>
        <input
          id="global_swarm_notify_smtp_password"
          type="password"
          :value="state.swarm_notify_smtp_password"
          autocomplete="off"
          @input="
            setKey(
              'swarm_notify_smtp_password',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">
          <code>SWARM_NOTIFY_SMTP_PASSWORD</code><SettingSourceNote field="swarm_notify_smtp_password" />
        </div>
      </div>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import SettingSourceNote from "@/shared/components/settings-fields/SettingSourceNote.vue";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const { state, setKey } = useGlobalSettings();
</script>

<style scoped>
.notify-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.notify-channel {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 8px;
  padding: 8px 12px 12px;
  margin: 0;
}
.notify-channel legend {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
  padding: 0 6px;
}
</style>
