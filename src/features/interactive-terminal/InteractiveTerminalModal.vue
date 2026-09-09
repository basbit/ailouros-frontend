<template>
  <div v-if="isOpen" class="terminal-modal-backdrop" @click="onClose">
    <div class="terminal-modal" role="dialog" aria-modal="true" @click.stop>
      <div class="terminal-modal__header">
        <div class="terminal-modal__title-group">
          <span
            class="terminal-modal__status-dot"
            :class="{
              'terminal-modal__status-dot--connected': connectionStatus === 'connected',
              'terminal-modal__status-dot--connecting':
                connectionStatus === 'connecting',
              'terminal-modal__status-dot--disconnected':
                connectionStatus === 'disconnected',
            }"
            :title="statusLabel"
          />
          <span class="terminal-modal__title">{{ t("terminal.title") }}</span>
          <span class="terminal-modal__status-text">{{ statusLabel }}</span>
        </div>

        <div class="terminal-modal__controls">
          <button type="button" class="terminal-modal__btn" @click="clear">
            {{ t("terminal.clear") }}
          </button>
          <button
            type="button"
            class="terminal-modal__btn"
            :disabled="connectionStatus === 'connected'"
            @click="connect"
          >
            {{ t("terminal.reconnect") }}
          </button>
          <button
            type="button"
            class="terminal-modal__btn terminal-modal__btn--close"
            :aria-label="t('terminal.close')"
            @click="onClose"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref="outputScreenRef" class="terminal-modal__screen">
        <pre class="terminal-modal__output">{{ terminalOutput }}</pre>
      </div>

      <form class="terminal-modal__input-bar" @submit.prevent="submitCommand">
        <span class="terminal-modal__prompt">&gt;</span>
        <input
          ref="commandInputRef"
          v-model="currentCommand"
          type="text"
          class="terminal-modal__input"
          :placeholder="t('terminal.placeholder')"
          :disabled="connectionStatus !== 'connected'"
          @keydown="handleKeyDown"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useTerminalWebSocket } from "./useTerminalWebSocket";

const props = defineProps<{
  taskId: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const { t } = useI18n();

const outputScreenRef = ref<HTMLDivElement | null>(null);
const commandInputRef = ref<HTMLInputElement | null>(null);
const currentCommand = ref("");

const { terminalOutput, connectionStatus, connect, disconnect, sendInput, clear } =
  useTerminalWebSocket(props.taskId);

const statusLabel = computed(() => {
  if (connectionStatus.value === "connected") return t("terminal.connected");
  if (connectionStatus.value === "connecting") return t("terminal.connecting");
  return t("terminal.disconnected");
});

watch(
  () => props.isOpen,
  (opened) => {
    if (opened) {
      connect();
      void nextTick(() => {
        commandInputRef.value?.focus();
      });
    } else {
      disconnect();
    }
  },
  { immediate: true },
);

watch(terminalOutput, () => {
  void nextTick(() => {
    if (outputScreenRef.value) {
      outputScreenRef.value.scrollTop = outputScreenRef.value.scrollHeight;
    }
  });
});

function submitCommand(): void {
  if (!currentCommand.value) {
    sendInput("\n");
    return;
  }
  sendInput(`${currentCommand.value}\n`);
  currentCommand.value = "";
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.ctrlKey && event.key.toLowerCase() === "c") {
    event.preventDefault();
    sendInput("\x03");
  } else if (event.ctrlKey && event.key.toLowerCase() === "d") {
    event.preventDefault();
    sendInput("\x04");
  }
}

function onClose(): void {
  disconnect();
  emit("close");
}
</script>

<style scoped>
.terminal-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.terminal-modal {
  width: 90vw;
  max-width: 800px;
  height: 520px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 1px solid #334155;
}

.terminal-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.terminal-modal__title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.terminal-modal__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.terminal-modal__status-dot--connected {
  background: #10b981;
}

.terminal-modal__status-dot--connecting {
  background: #f59e0b;
}

.terminal-modal__status-dot--disconnected {
  background: #ef4444;
}

.terminal-modal__status-text {
  font-size: 11px;
  color: #94a3b8;
}

.terminal-modal__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal-modal__btn {
  background: #334155;
  color: #e2e8f0;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.terminal-modal__btn:hover:not(:disabled) {
  background: #475569;
}

.terminal-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.terminal-modal__btn--close {
  background: transparent;
  font-size: 14px;
  padding: 2px 6px;
}

.terminal-modal__screen {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.4;
  background: #020617;
}

.terminal-modal__output {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.terminal-modal__input-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #1e293b;
  border-top: 1px solid #334155;
  gap: 8px;
}

.terminal-modal__prompt {
  font-family: monospace;
  color: #10b981;
  font-weight: 600;
}

.terminal-modal__input {
  flex: 1;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  outline: none;
}

.terminal-modal__input:disabled {
  opacity: 0.5;
}
</style>
