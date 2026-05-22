<template>
  <section class="conv-history">
    <header class="conv-history__head">
      <h3 class="conv-history__title">
        {{ t("history.detail.conversation.title") }}
      </h3>
      <span
        :class="[
          'conv-history__flag',
          sharedEnabledKnown ? (sharedEnabled ? 'on' : 'off') : 'unknown',
        ]"
        :title="t('history.detail.conversation.sharedHistoryTooltip')"
      >
        {{ sharedEnabledLabel }}
      </span>
    </header>
    <div v-if="loading" class="conv-history__hint">
      {{ t("history.detail.conversation.loading") }}
    </div>
    <div v-else-if="notImplemented" class="conv-history__hint">
      {{ t("history.detail.conversation.apiUnavailable") }}
    </div>
    <div v-else-if="error" class="conv-history__error">{{ error }}</div>
    <div v-else-if="sharedEnabledKnown && !sharedEnabled" class="conv-history__hint">
      {{ t("history.detail.conversation.sharedHistoryDisabled") }}
    </div>
    <div v-else-if="!messages.length" class="conv-history__hint">
      {{ t("history.detail.conversation.empty") }}
    </div>
    <ol v-else class="conv-history__list">
      <li
        v-for="msg in messages"
        :key="msg.id"
        :class="['conv-history__item', `conv-history__item--${roleClass(msg.role)}`]"
      >
        <div class="conv-history__meta">
          <span class="conv-history__role">{{ msg.role }}</span>
          <time class="conv-history__time">{{ formatTimestamp(msg.created_at) }}</time>
        </div>
        <p class="conv-history__content">{{ msg.content }}</p>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ConversationMessage } from "./conversation-types";
import { useI18n } from "@/shared/lib/i18n";

const props = withDefaults(
  defineProps<{
    messages: ConversationMessage[];
    loading?: boolean;
    error?: string | null;
    notImplemented?: boolean;
    sharedHistoryEnabled?: boolean | null;
  }>(),
  {
    loading: false,
    error: null,
    notImplemented: false,
    sharedHistoryEnabled: null,
  },
);

const { t } = useI18n();

const sharedEnabledKnown = computed(() => props.sharedHistoryEnabled !== null);
const sharedEnabled = computed(() => props.sharedHistoryEnabled === true);

const sharedEnabledLabel = computed(() => {
  if (!sharedEnabledKnown.value) {
    return t("history.detail.conversation.sharedHistoryUnknown");
  }
  return sharedEnabled.value
    ? t("history.detail.conversation.sharedHistoryOn")
    : t("history.detail.conversation.sharedHistoryOff");
});

function roleClass(role: string): string {
  return role.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "unknown";
}

function formatTimestamp(raw: string): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString();
}
</script>

<style scoped>
.conv-history {
  border: 1px solid #e2e2e6;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.conv-history__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.conv-history__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.conv-history__flag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #f0f0f3;
  text-transform: lowercase;
  letter-spacing: 0.04em;
}
.conv-history__flag.on {
  background: #d8ebd9;
  color: #1f6f2b;
}
.conv-history__flag.off {
  background: #ececec;
  color: #555;
}
.conv-history__flag.unknown {
  background: #fff3cd;
  color: #856404;
}
.conv-history__hint,
.conv-history__error {
  color: #888;
  font-size: 13px;
}
.conv-history__error {
  color: #c0392b;
}
.conv-history__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.conv-history__item {
  background: #fafafb;
  border-radius: 6px;
  padding: 8px;
  border-left: 3px solid #ccc;
}
.conv-history__item--user {
  border-left-color: #2f6fb3;
}
.conv-history__item--assistant {
  border-left-color: #1f6f2b;
}
.conv-history__item--system {
  border-left-color: #888;
}
.conv-history__meta {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 11px;
  color: #888;
}
.conv-history__role {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.conv-history__time {
  font-family: ui-monospace, SFMono-Regular, monospace;
}
.conv-history__content {
  margin: 4px 0 0;
  font-size: 13px;
  white-space: pre-wrap;
}
</style>
