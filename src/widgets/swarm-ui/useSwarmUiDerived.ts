/**
 * useSwarmUiDerived — small computed bundles for the main page:
 *   - profileOptions / skillsCatalogIds / mediaForm
 *   - visualProbeManifest
 *   - researchSourcesText / codeReviewFindingsText
 *   - backgroundAgentRemoteConfig
 *
 * Plain extraction of computeds from `SwarmUiPage`; no behavioural changes.
 */

import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useUiStore } from "@/shared/store/ui";
import type { useSettings } from "@/widgets/settings/useSettings";

type SettingsApi = ReturnType<typeof useSettings>;

export interface SwarmUiDerived {
  profileOptions: ComputedRef<{ value: string; label: string }[]>;
  skillsCatalogIds: ComputedRef<{ id: string; title: string }[]>;
  mediaForm: ComputedRef<{
    media_enabled: boolean;
    media_image_provider: string;
    media_image_model: string;
    media_image_api_key: string;
    media_audio_provider: string;
    media_audio_model: string;
    media_audio_api_key: string;
    media_audio_voice: string;
    media_budget_max_cost_usd: string;
    media_budget_max_attempts: string;
    media_license_policy: string;
  }>;
  visualProbeManifest: ComputedRef<Record<string, unknown> | null>;
  researchSourcesText: ComputedRef<string>;
  codeReviewFindingsText: ComputedRef<string>;
  backgroundAgentRemoteConfig: ComputedRef<{
    provider: string;
    apiKey: string;
    baseUrl: string;
  }>;
}

export function useSwarmUiDerived(settings: SettingsApi): SwarmUiDerived {
  const ui = useUiStore();

  const profileOptions = computed(() =>
    settings.profilesState.profiles.value
      .filter((p) => p.id.trim())
      .map((p) => ({ value: p.id, label: `${p.id} (${p.provider})` })),
  );

  const skillsCatalogIds = computed(() =>
    settings.skillsState.skills.value
      .map((s) => ({ id: (s.id ?? "").trim(), title: s.title ?? s.id }))
      .filter((s) => s.id),
  );

  const mediaForm = computed(() => ({
    media_enabled: settings.form.media_enabled,
    media_image_provider: settings.form.media_image_provider,
    media_image_model: settings.form.media_image_model,
    media_image_api_key: settings.form.media_image_api_key,
    media_audio_provider: settings.form.media_audio_provider,
    media_audio_model: settings.form.media_audio_model,
    media_audio_api_key: settings.form.media_audio_api_key,
    media_audio_voice: settings.form.media_audio_voice,
    media_budget_max_cost_usd: settings.form.media_budget_max_cost_usd,
    media_budget_max_attempts: settings.form.media_budget_max_attempts,
    media_license_policy: settings.form.media_license_policy,
  }));

  const visualProbeManifest = computed<Record<string, unknown> | null>(() => {
    const plan = ui.taskPipelinePlan as Record<string, unknown> | null;
    const direct = plan?.visual_probe_manifest;
    if (direct && typeof direct === "object") return direct as Record<string, unknown>;
    const partialState = plan?.partial_state;
    if (partialState && typeof partialState === "object") {
      const manifest = (partialState as Record<string, unknown>).visual_probe_manifest;
      if (manifest && typeof manifest === "object") {
        return manifest as Record<string, unknown>;
      }
    }
    return null;
  });

  function pickHistoryAgentText(agentName: string): string {
    const history = ui.taskHistory as { agent?: string; message?: string }[];
    for (const entry of history) {
      if (entry?.agent === agentName && typeof entry.message === "string") {
        return entry.message;
      }
    }
    return "";
  }

  const researchSourcesText = computed(
    () =>
      pickHistoryAgentText("crole_source_reviewer") ||
      pickHistoryAgentText("crole_web_researcher"),
  );

  const codeReviewFindingsText = computed(
    () =>
      pickHistoryAgentText("crole_escalation_reviewer") ||
      pickHistoryAgentText("problem_spotter") ||
      pickHistoryAgentText("review_dev"),
  );

  // Effective remote connection for the background agent. Prefer the global
  // connection fields; otherwise inherit the first stored profile that has a
  // key. Keeping provider/base_url aligned with the selected key avoids sending
  // an OpenAI-compatible key into the Anthropic SDK path.
  const backgroundAgentRemoteConfig = computed(() => {
    const globalProvider = settings.form.remote_api_provider?.trim() ?? "";
    const globalKey = settings.form.remote_api_key?.trim() ?? "";
    const globalBaseUrl = settings.form.remote_api_base_url?.trim() ?? "";
    if (globalKey || globalBaseUrl) {
      return { provider: globalProvider, apiKey: globalKey, baseUrl: globalBaseUrl };
    }
    for (const row of settings.profilesState.profiles.value ?? []) {
      const apiKey = row.api_key?.trim() ?? "";
      if (!apiKey) continue;
      return {
        provider: row.provider?.trim() ?? "",
        apiKey,
        baseUrl: row.base_url?.trim() ?? "",
      };
    }
    return { provider: globalProvider, apiKey: "", baseUrl: globalBaseUrl };
  });

  return {
    profileOptions,
    skillsCatalogIds,
    mediaForm,
    visualProbeManifest,
    researchSourcesText,
    codeReviewFindingsText,
    backgroundAgentRemoteConfig,
  };
}
