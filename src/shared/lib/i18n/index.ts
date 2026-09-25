import { computed } from "vue";
import { usePreferencesStore } from "@/shared/store/preferences";
import type { Locale, Messages } from "./types";
import { commonEn, commonRu } from "./common";
import { headerEn, headerRu } from "./header";
import { runEn, runRu } from "./run";
import { historyEn, historyRu } from "./history";
import { settingsEn, settingsRu } from "./settings";
import { projectEn, projectRu } from "./project";
import { pipelineEn, pipelineRu } from "./pipeline";
import { swarmEn, swarmRu } from "./swarm";
import { mediaEn, mediaRu } from "./media";
import { onboardingEn, onboardingRu } from "./onboarding";
import { taskMonitorEn, taskMonitorRu } from "./task-monitor";
import { agentsEn, agentsRu } from "./agents";
import { runDiagnosticsI18nEn, runDiagnosticsI18nRu } from "./run-diagnostics-i18n";
import { miscEn, miscRu } from "./misc";
import { scenariosEn, scenariosRu } from "./scenarios";
import { featureFlagsEn, featureFlagsRu } from "./feature-flags";
import { autoresearchEn, autoresearchRu } from "./autoresearch";
import { effectMetricsEn, effectMetricsRu } from "./effect-metrics";
import { codegenFeedbackEn, codegenFeedbackRu } from "./codegen-feedback";
import { remoteControlEn, remoteControlRu } from "./remote-control";
import { settingsLiveEn, settingsLiveRu } from "./settings-live";

const messages: Record<Locale, Messages> = {
  en: {
    ...commonEn,
    ...headerEn,
    ...runEn,
    ...historyEn,
    ...settingsEn,
    ...projectEn,
    ...pipelineEn,
    ...swarmEn,
    ...mediaEn,
    ...onboardingEn,
    ...taskMonitorEn,
    ...agentsEn,
    ...runDiagnosticsI18nEn,
    ...miscEn,
    ...scenariosEn,
    ...featureFlagsEn,
    ...codegenFeedbackEn,
    ...autoresearchEn,
    ...effectMetricsEn,
    ...remoteControlEn,
    ...settingsLiveEn,
  },
  ru: {
    ...commonRu,
    ...headerRu,
    ...runRu,
    ...historyRu,
    ...settingsRu,
    ...projectRu,
    ...pipelineRu,
    ...swarmRu,
    ...mediaRu,
    ...onboardingRu,
    ...taskMonitorRu,
    ...agentsRu,
    ...runDiagnosticsI18nRu,
    ...miscRu,
    ...scenariosRu,
    ...featureFlagsRu,
    ...codegenFeedbackRu,
    ...autoresearchRu,
    ...effectMetricsRu,
    ...remoteControlRu,
    ...settingsLiveRu,
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
