import type { AgentConfigForm } from "@/shared/lib/agent-config-types";

const DEFAULT_READY_PATH = "/";
const DEFAULT_MAX_REVIEW_IMAGES = 4;
const VISUAL_PAGE_SEPARATOR_PATTERN = /[\n,]+/;

function parseVisualPages(text: string): string[] {
  return text
    .split(VISUAL_PAGE_SEPARATOR_PATTERN)
    .map((value) => value.trim())
    .filter(Boolean);
}

function applyVisualBaseFields(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  if (!form.swarm_visual_probe_enabled) target.enabled = false;
  const baseUrl = form.swarm_visual_base_url.trim();
  if (baseUrl) target.base_url = baseUrl;
  const startCommand = form.swarm_visual_start_command.trim();
  if (startCommand) target.start_command = startCommand;
  const startDirectory = form.swarm_visual_start_directory.trim();
  if (startDirectory) target.start_directory = startDirectory;
  const readyPath = form.swarm_visual_ready_path.trim();
  if (readyPath && readyPath !== DEFAULT_READY_PATH) target.ready_path = readyPath;
}

function applyVisualPagesField(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const pages = parseVisualPages(form.swarm_visual_pages);
  if (!pages.length) return;
  const isDefaultRootOnly = pages.length === 1 && pages[0] === DEFAULT_READY_PATH;
  if (isDefaultRootOnly) return;
  target.pages = pages;
}

function applyVisualCaptureFlags(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  if (form.swarm_visual_capture_har) target.capture_har = true;
  if (form.swarm_visual_capture_trace) target.capture_trace = true;
  if (form.swarm_visual_multimodal_review) target.multimodal_review = true;
}

function applyVisualMaxReviewImages(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const parsed = parseInt(form.swarm_visual_max_review_images.trim(), 10);
  if (isNaN(parsed) || parsed <= 0 || parsed === DEFAULT_MAX_REVIEW_IMAGES) return;
  target.max_review_images = parsed;
}

export function buildVisualProbeConfig(form: AgentConfigForm): Record<string, unknown> {
  const visual: Record<string, unknown> = {};
  applyVisualBaseFields(visual, form);
  applyVisualPagesField(visual, form);
  applyVisualCaptureFlags(visual, form);
  applyVisualMaxReviewImages(visual, form);
  return visual;
}
