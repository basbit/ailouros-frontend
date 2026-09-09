<template>
  <div class="browser-viewport-modal-backdrop" @click.self="emit('close')">
    <div
      class="browser-viewport-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="`${t('liveBrowser.title')} - ${taskId}`"
    >
      <header class="browser-viewport-modal__header">
        <div class="browser-viewport-modal__title-group">
          <span class="browser-viewport-modal__icon">🌐</span>
          <h3 class="browser-viewport-modal__title">{{ t("liveBrowser.title") }}</h3>
          <code class="browser-viewport-modal__task-id">{{ taskId }}</code>
        </div>
        <button
          type="button"
          class="browser-viewport-modal__close-btn"
          aria-label="Close"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>

      <main class="browser-viewport-modal__body">
        <LiveBrowserViewport :task-id="taskId" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import LiveBrowserViewport from "./LiveBrowserViewport.vue";

defineProps<{
  taskId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    emit("close");
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<style scoped>
.browser-viewport-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.browser-viewport-modal {
  background: var(--bg-1, #121217);
  border: 1px solid var(--line, #333);
  border-radius: 12px;
  width: 92vw;
  max-width: 1200px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
}

.browser-viewport-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--card, #1c1c24);
  border-bottom: 1px solid var(--line, #2c2c35);
}

.browser-viewport-modal__title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.browser-viewport-modal__icon {
  font-size: 16px;
}

.browser-viewport-modal__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink, #fff);
}

.browser-viewport-modal__task-id {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  background: var(--bg-2, #2a2a35);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--ink-2, #bbb);
}

.browser-viewport-modal__close-btn {
  background: transparent;
  border: none;
  color: var(--ink-3, #888);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.browser-viewport-modal__close-btn:hover {
  background: var(--bg-2, #292936);
  color: var(--ink, #fff);
}

.browser-viewport-modal__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  min-height: 0;
}
</style>
