<template>
  <div class="notify-settings">
    <div class="field">
      <label class="checkbox-row">
        <input
          id="global_swarm_notify_enabled"
          type="checkbox"
          :checked="state.swarm_notify_enabled"
          @change="
            setKey('swarm_notify_enabled', ($event.target as HTMLInputElement).checked)
          "
        />
        <span class="check-label">{{ t("notify.enabled.label") }}</span>
      </label>
      <div class="hint">
        {{ t("notify.enabled.hint") }}
        <code>SWARM_NOTIFY_ENABLED</code>
      </div>
    </div>

    <div class="notify-row">
      <div class="field">
        <label class="field-label" for="global_swarm_notify_min_severity">
          {{ t("notify.severity.label") }}
        </label>
        <select
          id="global_swarm_notify_min_severity"
          :value="state.swarm_notify_min_severity"
          @change="
            setKey(
              'swarm_notify_min_severity',
              ($event.target as HTMLSelectElement).value,
            )
          "
        >
          <option value="">info</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
          <option value="critical">critical</option>
        </select>
        <div class="hint">
          <code>SWARM_NOTIFY_MIN_SEVERITY</code>
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="global_swarm_notify_rate">
          {{ t("notify.rate.label") }}
        </label>
        <input
          id="global_swarm_notify_rate"
          type="number"
          min="1"
          placeholder="30"
          :value="state.swarm_notify_rate_limit_per_min"
          @input="
            setKey(
              'swarm_notify_rate_limit_per_min',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">
          <code>SWARM_NOTIFY_RATE_LIMIT_PER_MIN</code>
        </div>
      </div>
    </div>

    <fieldset class="notify-channel">
      <legend>{{ t("notify.webhook.legend") }}</legend>
      <div class="field">
        <label for="global_swarm_notify_webhook_url">{{
          t("notify.webhook.urlLabel")
        }}</label>
        <input
          id="global_swarm_notify_webhook_url"
          type="url"
          :value="state.swarm_notify_webhook_url"
          placeholder="https://example.com/hook"
          @input="
            setKey(
              'swarm_notify_webhook_url',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint"><code>SWARM_NOTIFY_WEBHOOK_URL</code></div>
      </div>
      <div class="field">
        <label for="global_swarm_notify_webhook_token">{{
          t("notify.webhook.tokenLabel")
        }}</label>
        <input
          id="global_swarm_notify_webhook_token"
          type="password"
          :value="state.swarm_notify_webhook_token"
          autocomplete="off"
          @input="
            setKey(
              'swarm_notify_webhook_token',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint"><code>SWARM_NOTIFY_WEBHOOK_TOKEN</code></div>
      </div>
    </fieldset>

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
              setKey(
                'swarm_notify_smtp_host',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <div class="hint"><code>SWARM_NOTIFY_SMTP_HOST</code></div>
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
              setKey(
                'swarm_notify_smtp_port',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <div class="hint"><code>SWARM_NOTIFY_SMTP_PORT</code></div>
        </div>
      </div>
      <div class="field">
        <label class="checkbox-row">
          <input
            id="global_swarm_notify_smtp_tls"
            type="checkbox"
            :checked="state.swarm_notify_smtp_tls"
            @change="
              setKey(
                'swarm_notify_smtp_tls',
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          <span class="check-label">{{ t("notify.email.tlsLabel") }}</span>
        </label>
        <div class="hint"><code>SWARM_NOTIFY_SMTP_TLS</code></div>
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
            setKey(
              'swarm_notify_email_sender',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint"><code>SWARM_NOTIFY_EMAIL_SENDER</code></div>
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
          <code>SWARM_NOTIFY_EMAIL_RECIPIENTS</code>
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
              setKey(
                'swarm_notify_smtp_user',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <div class="hint"><code>SWARM_NOTIFY_SMTP_USER</code></div>
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
            <code>SWARM_NOTIFY_SMTP_PASSWORD</code>
          </div>
        </div>
      </div>
    </fieldset>

    <fieldset class="notify-channel">
      <legend>{{ t("notify.telegram.legend") }}</legend>
      <div class="notify-row">
        <div class="field">
          <label for="global_swarm_notify_telegram_bot_token">{{
            t("notify.telegram.botTokenLabel")
          }}</label>
          <input
            id="global_swarm_notify_telegram_bot_token"
            type="password"
            autocomplete="off"
            :value="state.swarm_notify_telegram_bot_token"
            @input="
              setKey(
                'swarm_notify_telegram_bot_token',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <div class="hint">
            <code>SWARM_NOTIFY_TELEGRAM_BOT_TOKEN</code>
          </div>
        </div>
        <div class="field">
          <label for="global_swarm_notify_telegram_chat_id">{{
            t("notify.telegram.chatIdLabel")
          }}</label>
          <input
            id="global_swarm_notify_telegram_chat_id"
            type="text"
            :value="state.swarm_notify_telegram_chat_id"
            @input="
              setKey(
                'swarm_notify_telegram_chat_id',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <div class="hint">
            <code>SWARM_NOTIFY_TELEGRAM_CHAT_ID</code>
          </div>
        </div>
      </div>
    </fieldset>

    <fieldset class="notify-channel">
      <legend>{{ t("notify.slack.legend") }}</legend>
      <div class="field">
        <label for="global_swarm_notify_slack_webhook_url">{{
          t("notify.slack.webhookLabel")
        }}</label>
        <input
          id="global_swarm_notify_slack_webhook_url"
          type="url"
          :value="state.swarm_notify_slack_webhook_url"
          placeholder="https://hooks.slack.com/services/..."
          @input="
            setKey(
              'swarm_notify_slack_webhook_url',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">
          <code>SWARM_NOTIFY_SLACK_WEBHOOK_URL</code>
        </div>
      </div>
    </fieldset>

    <fieldset class="notify-channel">
      <legend>{{ t("notify.discord.legend") }}</legend>
      <div class="field">
        <label for="global_swarm_notify_discord_webhook_url">{{
          t("notify.discord.webhookLabel")
        }}</label>
        <input
          id="global_swarm_notify_discord_webhook_url"
          type="url"
          :value="state.swarm_notify_discord_webhook_url"
          placeholder="https://discord.com/api/webhooks/..."
          @input="
            setKey(
              'swarm_notify_discord_webhook_url',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <div class="hint">
          <code>SWARM_NOTIFY_DISCORD_WEBHOOK_URL</code>
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const { state, setKey } = useGlobalSettings();
</script>

<style scoped>
.notify-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
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
