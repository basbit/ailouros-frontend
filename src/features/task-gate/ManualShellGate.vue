<template>
  <div v-if="visible" class="human-gate" style="border-color: #e6a817">
    <div class="human-gate-title" style="color: #e6a817">
      &#9888; {{ t("manualShellGate.title") }}
    </div>
    <p v-if="reason" style="margin-top: 6px; font-size: 12px; color: var(--text2)">
      {{ reason }}
    </p>
    <div
      style="
        margin-top: 8px;
        font-family: monospace;
        font-size: 12px;
        background: #1a1a1a;
        padding: 8px;
        border-radius: 4px;
        max-height: 240px;
        overflow-y: auto;
      "
    >
      <div v-for="(cmd, i) in commands" :key="i" style="position: relative">
        <span style="color: #e6c84a">$ </span>{{ cmd }}
        <button
          type="button"
          :aria-label="t('manualShellGate.copy')"
          style="
            margin-left: 8px;
            padding: 1px 6px;
            font-size: 11px;
            background: #333;
            border: 1px solid #555;
            border-radius: 3px;
            color: var(--text2);
            cursor: pointer;
          "
          @click="copyCommand(cmd)"
        >
          {{ t("manualShellGate.copy") }}
        </button>
      </div>
    </div>

    <div style="display: flex; gap: 8px; margin-top: 10px">
      <button
        type="button"
        class="btn-primary"
        style="background: #2a7a2a"
        :disabled="!commands.length"
        @click="emit('confirm', true)"
      >
        {{ t("manualShellGate.done") }}
      </button>
      <button
        type="button"
        class="btn-primary"
        style="background: #7a2a2a"
        @click="emit('confirm', false)"
      >
        {{ t("manualShellGate.cancel") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";

defineProps<{
  visible: boolean;
  commands: string[];
  reason: string;
}>();
const emit = defineEmits<{
  confirm: [done: boolean];
}>();

const { t } = useI18n();
const ux = useUxStore();

async function copyCommand(cmd: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(cmd);
    ux.notify(t("manualShellGate.copied"), "info", 1500);
  } catch (error) {
    console.warn("manualShellGate.copy: clipboard write failed:", error);
    ux.notify(t("manualShellGate.copyFailed"), "error", 2500);
  }
}
</script>
