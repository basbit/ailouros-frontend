<template>
  <div class="telegram-status" data-test="telegram-status">
    <span :class="['telegram-status__badge', `telegram-status__badge--${stateKey}`]">
      {{ t(`remoteControl.status.${stateKey}`) }}
    </span>
    <span v-if="reason" class="telegram-status__reason">{{ reason }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { TelegramIngressStatus } from "@/shared/api/endpoints/remote-control";

const props = defineProps<{
  status: TelegramIngressStatus | null;
  loadError: string;
}>();

const { t } = useI18n();

const stateKey = computed(() => {
  if (props.loadError) return "unknown";
  return props.status?.state ?? "unknown";
});

const reason = computed(() => props.loadError || props.status?.reason || "");
</script>

<style scoped>
.telegram-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.telegram-status__badge {
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-weight: 600;
}
.telegram-status__badge--running {
  color: var(--success, #30a46c);
}
.telegram-status__badge--error {
  color: var(--danger, #e5484d);
}
.telegram-status__badge--stopping,
.telegram-status__badge--stopped,
.telegram-status__badge--unknown {
  color: var(--text2, #a8b0c4);
}
.telegram-status__reason {
  color: var(--text2, #a8b0c4);
}
</style>
