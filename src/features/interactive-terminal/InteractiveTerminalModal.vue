<template>
  <div v-if="isOpen" class="terminal-modal-backdrop" @click="onClose">
    <div
      ref="dialogRef"
      class="terminal-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t('terminal.title')"
      @click.stop
      @keydown="onDialogKeydown"
    >
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
            @click="() => void connect()"
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

      <p
        v-if="errorMessage"
        class="terminal-modal__error chip chip--failed"
        role="alert"
      >
        {{ errorMessage }}
      </p>

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
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useTerminalWebSocket } from "./useTerminalWebSocket";

const props = defineProps<{
  taskId: string;
  workspaceRoot: string | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const { t } = useI18n();

const dialogRef = ref<HTMLDivElement | null>(null);
const outputScreenRef = ref<HTMLDivElement | null>(null);
const commandInputRef = ref<HTMLInputElement | null>(null);
const currentCommand = ref("");
let focusOrigin: HTMLElement | null = null;

const {
  terminalOutput,
  connectionStatus,
  lastErrorKey,
  connect,
  disconnect,
  sendInput,
  clear,
} = useTerminalWebSocket({
  taskId: () => props.taskId,
  workspaceRoot: () => props.workspaceRoot,
});

const statusLabel = computed(() => {
  if (connectionStatus.value === "connected") return t("terminal.connected");
  if (connectionStatus.value === "connecting") return t("terminal.connecting");
  return t("terminal.disconnected");
});

const errorMessage = computed(() => (lastErrorKey.value ? t(lastErrorKey.value) : ""));

function focusableElements(): HTMLElement[] {
  if (!dialogRef.value) return [];
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
    ),
  );
}

function trapTab(event: KeyboardEvent): void {
  const focusable = focusableElements();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function onDialogKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key === "Tab") trapTab(event);
}

function onWindowKeydown(event: KeyboardEvent): void {
  if (props.isOpen && event.key === "Escape") {
    event.preventDefault();
    onClose();
  }
}

watch(
  () => props.isOpen,
  (opened) => {
    if (opened) {
      focusOrigin = document.activeElement as HTMLElement | null;
      window.addEventListener("keydown", onWindowKeydown);
      void connect();
      void nextTick(() => {
        // While the socket is still handshaking the input is disabled and
        // cannot take focus, so fall back to the first enabled control.
        const input = commandInputRef.value;
        const target =
          input && !input.disabled ? input : (focusableElements()[0] ?? null);
        target?.focus();
      });
    } else {
      window.removeEventListener("keydown", onWindowKeydown);
      disconnect();
      focusOrigin?.focus();
      focusOrigin = null;
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

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onWindowKeydown);
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
.terminal-modal__error {
  margin: 0 18px 10px;
  align-self: flex-start;
  color: var(--error);
  background: color-mix(in srgb, var(--error) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--error) 35%, transparent);
}

.terminal-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.terminal-modal {
  width: 90vw;
  max-width: 800px;
  height: 520px;
  background: var(--card);
  color: var(--ink);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--line-strong);
}

.terminal-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: var(--card-soft);
  border-bottom: 1px solid var(--line);
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
  background: var(--ok);
}

.terminal-modal__status-dot--connecting {
  background: var(--warn);
}

.terminal-modal__status-dot--disconnected {
  background: var(--error);
}

.terminal-modal__status-text {
  font-size: 11px;
  color: var(--ink-3);
}

.terminal-modal__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal-modal__btn {
  background: var(--card-soft);
  color: var(--ink);
  border: 1px solid var(--line);
  padding: 4px 8px;
  border-radius: var(--radius);
  font-size: 12.5px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.terminal-modal__btn:hover:not(:disabled) {
  background: var(--bg-3);
}

.terminal-modal__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.terminal-modal__btn--close {
  background: transparent;
  border-color: transparent;
  font-size: 14px;
  padding: 2px 6px;
}

.terminal-modal__screen {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.4;
  background: var(--bg);
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
  background: var(--card-soft);
  border-top: 1px solid var(--line);
  gap: 8px;
}

.terminal-modal__prompt {
  font-family: var(--font-mono);
  color: var(--ok);
  font-weight: 600;
}

.terminal-modal__input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  outline: none;
}

.terminal-modal__input:disabled {
  opacity: 0.5;
}
</style>
