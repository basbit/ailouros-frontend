<template>
  <div v-if="visible" class="human-gate manual-shell-gate manual-shell-gate--warning">
    <div class="human-gate-title manual-shell-gate__title">
      &#9888; {{ t("manualShellGate.title") }}
    </div>
    <p v-if="reason" class="manual-shell-gate__reason">
      {{ reason }}
    </p>
    <div class="manual-shell-gate__code-block">
      <div v-for="(cmd, i) in commands" :key="i" class="manual-shell-gate__cmd-row">
        <span class="manual-shell-gate__prompt">$ </span>{{ cmd }}
        <button
          type="button"
          class="manual-shell-gate__copy-btn"
          :aria-label="t('manualShellGate.copy')"
          @click="copyCommand(cmd)"
        >
          {{ t("manualShellGate.copy") }}
        </button>
      </div>
    </div>

    <div class="manual-shell-gate__actions">
      <button
        type="button"
        class="btn-primary btn-primary--success"
        :disabled="!commands.length"
        @click="emit('confirm', true)"
      >
        {{ t("manualShellGate.done") }}
      </button>
      <button
        type="button"
        class="btn-primary btn-primary--danger"
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

<style scoped>
.manual-shell-gate--warning {
  border-color: var(--warning);
}
.manual-shell-gate__title {
  color: var(--warning);
}
.manual-shell-gate__reason {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text2);
}
.manual-shell-gate__code-block {
  margin-top: 8px;
  padding: 8px;
  font-family: var(--mono);
  font-size: 12px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  max-height: 240px;
  overflow-y: auto;
}
.manual-shell-gate__cmd-row {
  position: relative;
  padding: 1px 0;
}
.manual-shell-gate__prompt {
  color: var(--warning);
}
.manual-shell-gate__copy-btn {
  margin-left: 8px;
  padding: 1px 6px;
  font-size: 11px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--text2);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.manual-shell-gate__copy-btn:hover {
  background: var(--surface);
  border-color: var(--border-focus);
  color: var(--text);
}
.manual-shell-gate__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
