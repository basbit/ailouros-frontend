<template>
  <Teleport to="body">
    <Transition name="settings-drawer">
      <div
        v-if="open"
        class="settings-drawer-root"
        role="dialog"
        :aria-label="t('settingsDrawer.title')"
        aria-modal="true"
        @keydown.esc="close"
      >
        <div class="settings-drawer-backdrop" @click="close"></div>
        <aside ref="panelRef" class="settings-drawer-panel" tabindex="-1" @click.stop>
          <header class="settings-drawer-header">
            <div class="settings-drawer-header__title">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                />
              </svg>
              <span>{{ t("settingsDrawer.title") }}</span>
              <span class="scope-badge scope-badge-global">{{
                t("settingsDrawer.scope")
              }}</span>
            </div>
            <button
              type="button"
              class="settings-drawer-close"
              :title="t('settingsDrawer.close')"
              :aria-label="t('settingsDrawer.close')"
              @click="close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>
          <div class="settings-drawer-body">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const { t } = useI18n();
const panelRef = ref<HTMLElement | null>(null);

function close(): void {
  emit("update:open", false);
}

// Focus the panel when it opens, so Esc works and users with keyboards
// can navigate the drawer contents.
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    await nextTick();
    panelRef.value?.focus();
  },
);
</script>

<style scoped>
.settings-drawer-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}
.settings-drawer-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(2px);
  pointer-events: auto;
}
.settings-drawer-panel {
  position: relative;
  width: min(560px, 100%);
  height: 100%;
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-shadow: -16px 0 48px color-mix(in srgb, var(--bg) 70%, transparent);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  outline: none;
}
.settings-drawer-header {
  flex-shrink: 0;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.settings-drawer-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: var(--text);
}
.settings-drawer-close {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text2);
  width: 28px;
  height: 28px;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}
.settings-drawer-close:hover {
  background: var(--surface);
  border-color: var(--border-hi);
  color: var(--text);
}
.settings-drawer-close svg,
.settings-drawer-header__title svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
.settings-drawer-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 14px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-drawer-enter-active,
.settings-drawer-leave-active {
  transition: opacity 0.18s ease;
}
.settings-drawer-enter-active .settings-drawer-panel,
.settings-drawer-leave-active .settings-drawer-panel {
  transition: transform 0.22s var(--ease-spring);
}
.settings-drawer-enter-from,
.settings-drawer-leave-to {
  opacity: 0;
}
.settings-drawer-enter-from .settings-drawer-panel,
.settings-drawer-leave-to .settings-drawer-panel {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .settings-drawer-enter-active,
  .settings-drawer-leave-active,
  .settings-drawer-enter-active .settings-drawer-panel,
  .settings-drawer-leave-active .settings-drawer-panel {
    transition: none;
  }
}
</style>
