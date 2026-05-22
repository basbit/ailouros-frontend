<template>
  <section class="profile-pane">
    <PaneHeader
      :title="t('settings.profile.title')"
      :subtitle="t('settings.profile.subtitle')"
    />
    <div class="profile-pane__row">
      <span class="profile-pane__label">
        {{ t("settings.profile.locale") }}
      </span>
      <select
        class="profile-pane__select"
        :value="preferences.locale"
        @change="onLocaleChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="en">{{ t("settings.profile.localeEn") }}</option>
        <option value="ru">{{ t("settings.profile.localeRu") }}</option>
      </select>
    </div>
    <div class="profile-pane__row">
      <span class="profile-pane__label">
        {{ t("settings.profile.theme") }}
      </span>
      <div class="profile-pane__theme">
        <button
          type="button"
          class="profile-pane__theme-btn"
          :class="{ 'profile-pane__theme-btn--active': preferences.theme === 'light' }"
          @click="preferences.setTheme('light')"
        >
          {{ t("settings.profile.themeLight") }}
        </button>
        <button
          type="button"
          class="profile-pane__theme-btn"
          :class="{ 'profile-pane__theme-btn--active': preferences.theme === 'dark' }"
          @click="preferences.setTheme('dark')"
        >
          {{ t("settings.profile.themeDark") }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { usePreferencesStore } from "@/shared/store/preferences";
import { useI18n } from "@/shared/lib/i18n";

const preferences = usePreferencesStore();
const { t } = useI18n();

function onLocaleChange(value: string): void {
  if (value === "en" || value === "ru") {
    preferences.setLocale(value);
  }
}
</script>

<style scoped>
.profile-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
}

.profile-pane__row {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.profile-pane__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}

.profile-pane__select {
  appearance: none;
  padding: 7px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--bg-2);
  color: var(--ink);
  font-size: 13px;
  cursor: pointer;
  min-width: 160px;
}

.profile-pane__theme {
  display: flex;
  gap: 6px;
}

.profile-pane__theme-btn {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.profile-pane__theme-btn:hover {
  border-color: var(--line-strong);
}

.profile-pane__theme-btn--active {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}
</style>
