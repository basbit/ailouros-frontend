import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { readRawString, writeRawString } from "@/shared/lib/storage-utils";
import { STORAGE_KEYS } from "@/shared/lib/storage-keys";

type Theme = "dark" | "light";
type Locale = "en" | "ru";
export type Density = "comfortable" | "compact";

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = String(navigator.language || "").toLowerCase();
  return lang.startsWith("ru") ? "ru" : "en";
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function applyDensity(density: Density): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--density",
    density === "compact" ? "0.85" : "1",
  );
}

export const usePreferencesStore = defineStore("preferences", () => {
  const locale = ref<Locale>(
    (readRawString(STORAGE_KEYS.preferenceLocale.key) as Locale | null) ??
      detectLocale(),
  );
  const theme = ref<Theme>(
    (readRawString(STORAGE_KEYS.preferenceTheme.key) as Theme | null) ?? "dark",
  );
  const sidebarCollapsed = ref<boolean>(
    readRawString(STORAGE_KEYS.preferenceSidebarCollapsed.key) === "1",
  );
  const density = ref<Density>(
    (readRawString(STORAGE_KEYS.preferenceDensity.key) as Density | null) ??
      "comfortable",
  );

  const isDark = computed(() => theme.value === "dark");

  function setLocale(next: Locale): void {
    locale.value = next;
  }

  function setTheme(next: Theme): void {
    theme.value = next;
  }

  function toggleTheme(): void {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setDensity(next: Density): void {
    density.value = next;
  }

  watch(
    locale,
    (value) => {
      writeRawString(STORAGE_KEYS.preferenceLocale.key, value);
      if (typeof document !== "undefined") {
        document.documentElement.lang = value;
      }
    },
    { immediate: true },
  );

  watch(
    theme,
    (value) => {
      writeRawString(STORAGE_KEYS.preferenceTheme.key, value);
      applyTheme(value);
    },
    { immediate: true },
  );

  watch(
    sidebarCollapsed,
    (value) => {
      writeRawString(STORAGE_KEYS.preferenceSidebarCollapsed.key, value ? "1" : "0");
    },
    { immediate: true },
  );

  watch(
    density,
    (value) => {
      writeRawString(STORAGE_KEYS.preferenceDensity.key, value);
      applyDensity(value);
    },
    { immediate: true },
  );

  return {
    locale,
    theme,
    isDark,
    sidebarCollapsed,
    density,
    setLocale,
    setTheme,
    toggleTheme,
    toggleSidebar,
    setDensity,
  };
});
