import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { persistenceAdapter } from "@/shared/lib/persistence-adapter";
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
    (persistenceAdapter.readString(
      STORAGE_KEYS.preferenceLocale.key,
    ) as Locale | null) ?? detectLocale(),
  );
  const theme = ref<Theme>(
    (persistenceAdapter.readString(STORAGE_KEYS.preferenceTheme.key) as Theme | null) ??
      "dark",
  );
  const isSidebarCollapsed = ref<boolean>(
    persistenceAdapter.readString(STORAGE_KEYS.preferenceSidebarCollapsed.key) === "1",
  );
  const density = ref<Density>(
    (persistenceAdapter.readString(
      STORAGE_KEYS.preferenceDensity.key,
    ) as Density | null) ?? "comfortable",
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
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  }

  function setDensity(next: Density): void {
    density.value = next;
  }

  watch(
    locale,
    (value) => {
      persistenceAdapter.write(STORAGE_KEYS.preferenceLocale.key, value);
      if (typeof document !== "undefined") {
        document.documentElement.lang = value;
      }
    },
    { immediate: true },
  );

  watch(
    theme,
    (value) => {
      persistenceAdapter.write(STORAGE_KEYS.preferenceTheme.key, value);
      applyTheme(value);
    },
    { immediate: true },
  );

  watch(
    isSidebarCollapsed,
    (value) => {
      persistenceAdapter.write(
        STORAGE_KEYS.preferenceSidebarCollapsed.key,
        value ? "1" : "0",
      );
    },
    { immediate: true },
  );

  watch(
    density,
    (value) => {
      persistenceAdapter.write(STORAGE_KEYS.preferenceDensity.key, value);
      applyDensity(value);
    },
    { immediate: true },
  );

  return {
    locale,
    theme,
    isDark,
    isSidebarCollapsed,
    density,
    setLocale,
    setTheme,
    toggleTheme,
    toggleSidebar,
    setDensity,
  };
});
