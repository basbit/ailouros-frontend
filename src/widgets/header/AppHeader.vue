<template>
  <header class="app-header">
    <button
      type="button"
      class="sidebar-toggle"
      :title="
        preferences.sidebarCollapsed
          ? t('header.sidebar.open')
          : t('header.sidebar.close')
      "
      @click="preferences.toggleSidebar()"
    >
      <!-- Hamburger / Close -->
      <svg
        v-if="preferences.sidebarCollapsed"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    <div class="app-logo">
      <!-- AllourOS cat icon -->
      <div class="app-logo-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="18"
          height="18"
          fill="none"
        >
          <circle cx="13" cy="19" r="9" fill="#13100b" />
          <polygon points="5.5,15 3.5,7.5 10.5,12" fill="#13100b" />
          <polygon points="20.5,15 22.5,7.5 15.5,12" fill="#13100b" />
          <polygon points="6.2,14 5.2,9 9.5,11.5" fill="rgba(240,176,73,0.38)" />
          <polygon points="19.8,14 20.8,9 16.5,11.5" fill="rgba(240,176,73,0.38)" />
          <ellipse cx="9.5" cy="18.5" rx="1.5" ry="1.7" fill="#f0b849" />
          <ellipse cx="16.5" cy="18.5" rx="1.5" ry="1.7" fill="#f0b849" />
          <ellipse cx="9.5" cy="18.5" rx="0.45" ry="1.4" fill="#0a0806" />
          <ellipse cx="16.5" cy="18.5" rx="0.45" ry="1.4" fill="#0a0806" />
          <polygon points="13,21 11.7,22.4 14.3,22.4" fill="#e87d3e" opacity="0.9" />
          <path
            d="M 20 23 C 29 21 30.5 13 26 8 C 23.5 4.5 20 7.5 22.5 11"
            stroke="#f0b849"
            stroke-width="2.2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <span class="app-logo-name">{{ t("app.title") }}</span>
    </div>

    <div class="hdr-sep"></div>

    <div class="header-kv">
      <span class="header-kv__label">{{ t("header.project") }}</span>
      <strong class="header-kv__value">{{ projectName || "—" }}</strong>
    </div>

    <div class="task-pill" :class="{ running: isRunning }">
      <span class="dot"></span>
      <span>{{ taskId ?? t("header.noTask") }}</span>
    </div>

    <div class="hdr-spacer"></div>

    <div class="header-status" :class="{ 'header-status--running': isRunning }">
      <span
        class="header-status-dot"
        :class="{ 'header-status-dot--active': isRunning }"
      ></span>
      {{ isRunning ? t("header.running") : t("header.idle") }}
    </div>

    <select
      class="header-locale"
      :title="t('header.locale')"
      :value="preferences.locale"
      @change="
        preferences.setLocale(($event.target as HTMLSelectElement).value as 'en' | 'ru')
      "
    >
      <option value="en">EN</option>
      <option value="ru">RU</option>
    </select>

    <button
      class="theme-toggle"
      :title="preferences.isDark ? t('header.theme.light') : t('header.theme.dark')"
      @click="preferences.toggleTheme()"
    >
      <!-- Sun / Moon icons -->
      <svg
        v-if="preferences.isDark"
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
import { usePreferencesStore } from "@/shared/store/preferences";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  taskId: string | null;
  isRunning: boolean;
  projectName?: string | null;
  agentEditorActive?: boolean;
}>();

// Declared for parent API parity; AppHeader has no agent-editor button
// yet, but SwarmUiPage listens for this event — keep the typed contract.
defineEmits<{
  "toggle-agent-editor": [];
}>();

const preferences = usePreferencesStore();
const { t } = useI18n();
</script>

<style scoped>
.hdr-spacer {
  flex: 1;
}

.app-logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: linear-gradient(145deg, #1c140d, #100c08);
  border: 1px solid rgba(240, 180, 73, 0.22);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.app-logo-name {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.025em;
}

.sidebar-toggle,
.theme-toggle {
  background: none;
  border: 1px solid var(--border);
  cursor: pointer;
  padding: 6px 9px;
  border-radius: 999px;
  line-height: 1;
  color: var(--text2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.18s,
    border-color 0.18s,
    color 0.18s,
    box-shadow 0.18s;
}
.sidebar-toggle:hover,
.theme-toggle:hover {
  background: var(--surface2);
  border-color: var(--border-hi);
  color: var(--text);
  box-shadow: 0 0 0 2px rgba(244, 193, 93, 0.1);
}

.header-kv {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.header-kv__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text3);
}
.header-kv__value {
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text3);
  transition: color 0.2s;
}
.header-status--running {
  color: var(--success);
}
.header-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text3);
  flex-shrink: 0;
  transition: background 0.2s;
}
.header-status-dot--active {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
  animation: pulse 1.4s ease-in-out infinite;
}

.header-locale {
  width: auto;
  min-width: 66px;
  padding: 6px 26px 6px 10px;
  border-radius: 999px;
}

@media (max-width: 900px) {
  .header-kv {
    display: none;
  }
  .header-status {
    display: none;
  }
}
</style>
