<template>
  <div class="conversation-tab">
    <ConversationHistoryPanel
      :messages="messages"
      :loading="loading"
      :error="errorMessage"
      :not-implemented="notImplemented ?? false"
      :shared-history-enabled="sharedHistoryEnabled ?? undefined"
    />
  </div>
</template>

<script setup lang="ts">
import ConversationHistoryPanel from "@/features/conversation-history/ConversationHistoryPanel.vue";

import type { ConversationMessage } from "@/features/conversation-history/conversation-types";

defineProps<{
  messages: ConversationMessage[];
  loading: boolean;
  errorMessage: string | null;
  notImplemented: boolean | null;
  sharedHistoryEnabled: boolean | null;
}>();
</script>

<style scoped>
.conversation-tab {
  display: flex;
  flex-direction: column;
}
</style>
