import { computed } from "vue";
import { usePreferencesStore } from "@/shared/store/preferences";
import type { Locale, Messages } from "./types";
import { commonEn, commonRu } from "./common";
import { projectEn, projectRu } from "./project";
import { pipelineEn, pipelineRu } from "./pipeline";
import { swarmEn, swarmRu } from "./swarm";
import { mediaEn, mediaRu } from "./media";
import { onboardingEn, onboardingRu } from "./onboarding";
import { taskMonitorEn, taskMonitorRu } from "./task-monitor";
import { agentsEn, agentsRu } from "./agents";
import { miscEn, miscRu } from "./misc";

const messages: Record<Locale, Messages> = {
  en: {
    ...commonEn,
    ...projectEn,
    ...pipelineEn,
    ...swarmEn,
    ...mediaEn,
    ...onboardingEn,
    ...taskMonitorEn,
    ...agentsEn,
    ...miscEn,
  },
  ru: {
    ...commonRu,
    ...projectRu,
    ...pipelineRu,
    ...swarmRu,
    ...mediaRu,
    ...onboardingRu,
    ...taskMonitorRu,
    ...agentsRu,
    ...miscRu,
  },
};

export function useI18n() {
  const preferences = usePreferencesStore();
  const locale = computed(() => preferences.locale);

  function t(
    key: string,
    params?: Record<string, string | number | null | undefined>,
  ): string {
    const template = messages[locale.value][key] ?? messages.en[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (_, token: string) => {
      const value = params[token];
      return value == null ? "" : String(value);
    });
  }

  return {
    locale,
    t,
  };
}
