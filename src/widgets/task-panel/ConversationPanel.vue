<template>
  <section class="conversation-panel">
    <header class="conversation-panel__head">
      <span class="conversation-panel__title">{{ t("conversation.title") }}</span>
      <span
        v-if="!sharedHistoryEnabled && messages.length === 0 && !loading && !error"
        class="conversation-panel__hint"
      >
        {{ t("conversation.disabled") }}
      </span>
      <button
        type="button"
        class="conversation-panel__reload"
        :disabled="loading"
        @click="reload"
      >
        ↻
      </button>
    </header>
    <div v-if="!taskId" class="conversation-panel__hint">
      {{ t("conversation.noTask") }}
    </div>
    <div v-else-if="loading" class="conversation-panel__hint">
      {{ t("conversation.loading") }}
    </div>
    <div v-else-if="error" class="conversation-panel__error">{{ error }}</div>
    <div v-else-if="messages.length === 0" class="conversation-panel__hint">
      {{ t("conversation.empty") }}
    </div>
    <ol v-else class="conversation-panel__list">
      <li
        v-for="message in messages"
        :key="message.id"
        class="conversation-panel__msg"
        :class="`conversation-panel__msg--${message.role}`"
      >
        <div class="conversation-panel__msg-head">
          <span class="conversation-panel__role">{{ message.role }}</span>
          <time
            v-if="message.created_at"
            class="conversation-panel__time"
            :datetime="message.created_at"
          >
            {{ formatTime(message.created_at) }}
          </time>
        </div>
        <div class="conversation-panel__content">{{ message.content }}</div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import {
  getConversation,
  type ConversationMessageDto,
} from "@/shared/api/endpoints/conversation";
import { useI18n } from "@/shared/lib/i18n";

const props = withDefaults(
  defineProps<{
    taskId: string | null;
    limit?: number;
  }>(),
  { taskId: null, limit: 200 },
);

const { t } = useI18n();
const messages = ref<ConversationMessageDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const sharedHistoryEnabled = ref(false);

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

async function reload(): Promise<void> {
  if (!props.taskId) {
    messages.value = [];
    error.value = null;
    sharedHistoryEnabled.value = false;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const dto = await getConversation(props.taskId, props.limit);
    messages.value = dto.messages ?? [];
    sharedHistoryEnabled.value = dto.shared_history_enabled;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    messages.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void reload();
});

watch(
  () => props.taskId,
  () => {
    void reload();
  },
);
</script>

<style scoped>
.conversation-panel {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 120px;
}
.conversation-panel__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conversation-panel__title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}
.conversation-panel__hint,
.conversation-panel__error {
  font-size: 12px;
  color: var(--ink-3);
}
.conversation-panel__error {
  color: var(--error);
}
.conversation-panel__reload {
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink);
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
}
.conversation-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}
.conversation-panel__msg {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--bg-2);
}
.conversation-panel__msg--user {
  border-left: 3px solid var(--accent);
}
.conversation-panel__msg--assistant {
  border-left: 3px solid var(--success);
}
.conversation-panel__msg-head {
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-family: var(--font-mono);
  color: var(--ink-4);
}
.conversation-panel__time {
  font-size: 10px;
}
.conversation-panel__content {
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
  margin-top: 2px;
}
</style>
