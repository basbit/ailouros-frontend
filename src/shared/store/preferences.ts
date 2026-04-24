import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

const LS_LOCALE = "ailouros.locale";
const LS_THEME = "ailouros.theme";
const LS_SIDEBAR = "ailouros.sidebar_collapsed";

type Theme = "dark" | "light";
type Locale = "en" | "ru";

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = String(navigator.language || "").toLowerCase();
  return lang.startsWith("ru") ? "ru" : "en";
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export const usePreferencesStore = defineStore("preferences", () => {
  const locale = ref<Locale>(
    (readStorage(LS_LOCALE) as Locale | null) ?? detectLocale(),
  );
  const theme = ref<Theme>((readStorage(LS_THEME) as Theme | null) ?? "dark");
  const sidebarCollapsed = ref<boolean>(readStorage(LS_SIDEBAR) === "1");

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

  watch(
    locale,
    (value) => {
      writeStorage(LS_LOCALE, value);
      if (typeof document !== "undefined") {
        document.documentElement.lang = value;
      }
    },
    { immediate: true },
  );

  watch(
    theme,
    (value) => {
      writeStorage(LS_THEME, value);
      applyTheme(value);
    },
    { immediate: true },
  );

  watch(
    sidebarCollapsed,
    (value) => {
      writeStorage(LS_SIDEBAR, value ? "1" : "0");
    },
    { immediate: true },
  );

  return {
    locale,
    theme,
    isDark,
    sidebarCollapsed,
    setLocale,
    setTheme,
    toggleTheme,
    toggleSidebar,
  };
});
