import type { AgentConfigForm } from "@/shared/lib/agent-config-types";

function buildMediaImage(form: AgentConfigForm): Record<string, string> {
  const image: Record<string, string> = {};
  const provider = form.media_image_provider?.trim() ?? "";
  if (provider) image.provider = provider;
  const model = form.media_image_model?.trim() ?? "";
  if (model) image.model = model;
  const apiKey = form.media_image_api_key?.trim() ?? "";
  if (apiKey) image.api_key = apiKey;
  return image;
}

function buildMediaAudio(form: AgentConfigForm): Record<string, string> {
  const audio: Record<string, string> = {};
  const provider = form.media_audio_provider?.trim() ?? "";
  if (provider) audio.provider = provider;
  const model = form.media_audio_model?.trim() ?? "";
  if (model) audio.model = model;
  const apiKey = form.media_audio_api_key?.trim() ?? "";
  if (apiKey) audio.api_key = apiKey;
  const voice = form.media_audio_voice?.trim() ?? "";
  if (voice) audio.voice = voice;
  return audio;
}

function buildMediaBudget(form: AgentConfigForm): Record<string, number> {
  const budget: Record<string, number> = {};
  const maxCost = parseFloat(form.media_budget_max_cost_usd?.trim() ?? "");
  if (!isNaN(maxCost) && maxCost > 0) budget.max_cost_usd_per_task = maxCost;
  const maxAttempts = parseInt(form.media_budget_max_attempts?.trim() ?? "", 10);
  if (!isNaN(maxAttempts) && maxAttempts > 0) {
    budget.max_attempts_per_asset = maxAttempts;
  }
  return budget;
}

export function buildMediaSection(
  form: AgentConfigForm,
): Record<string, unknown> | undefined {
  if (!form.media_enabled) return undefined;
  const media: Record<string, unknown> = { enabled: true };
  const image = buildMediaImage(form);
  if (Object.keys(image).length) media.image = image;
  const audio = buildMediaAudio(form);
  if (Object.keys(audio).length) media.audio = audio;
  const budget = buildMediaBudget(form);
  if (Object.keys(budget).length) media.budget = budget;
  const licensePolicy = form.media_license_policy?.trim() ?? "";
  if (licensePolicy) media.license_policy = licensePolicy;
  return media;
}
