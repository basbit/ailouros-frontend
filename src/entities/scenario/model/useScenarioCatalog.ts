import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { listScenarios } from "@/shared/api/endpoints/scenarios";
import { initApiBase } from "@/shared/api/base";
import { invokeCommand, isDesktop } from "@/shared/lib/desktop-bridge";
import type { ScenarioCategory, ScenarioSummary } from "@/shared/model/scenario-types";

const scenarios = ref<ScenarioSummary[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let inflight: Promise<void> | null = null;
let loaded = false;

interface RawScenario {
  id?: string;
  title?: string;
  category?: string;
  description?: string;
  pipeline_steps?: string[];
  default_gates?: string[];
  expected_artifacts?: string[];
  required_tools?: string[];
  recommended_models?: Record<string, string>;
  workspace_write_default?: boolean;
  tags?: string[];
  quality_checks?: unknown[];
  inputs?: unknown[];
}

function toSummary(raw: RawScenario): ScenarioSummary | null {
  const id = String(raw.id ?? "").trim();
  const title = String(raw.title ?? "").trim();
  const category = String(raw.category ?? "").trim();
  if (!id || !title || !category) return null;
  return {
    id,
    title,
    category: category as ScenarioCategory,
    description: String(raw.description ?? ""),
    pipeline_steps: Array.isArray(raw.pipeline_steps) ? raw.pipeline_steps : [],
    default_gates: Array.isArray(raw.default_gates) ? raw.default_gates : [],
    expected_artifacts: Array.isArray(raw.expected_artifacts)
      ? raw.expected_artifacts
      : [],
    required_tools: Array.isArray(raw.required_tools) ? raw.required_tools : [],
    recommended_models:
      raw.recommended_models && typeof raw.recommended_models === "object"
        ? raw.recommended_models
        : {},
    workspace_write_default: !!raw.workspace_write_default,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    quality_checks: Array.isArray(raw.quality_checks) ? raw.quality_checks : [],
    inputs: Array.isArray(raw.inputs) ? raw.inputs : [],
  } as ScenarioSummary;
}

async function fetchFromBundle(): Promise<ScenarioSummary[]> {
  if (!isDesktop()) return [];
  try {
    const raw = await invokeCommand<RawScenario[]>("list_bundled_scenarios");
    if (!Array.isArray(raw)) return [];
    const out: ScenarioSummary[] = [];
    for (const entry of raw) {
      const summary = toSummary(entry);
      if (summary) out.push(summary);
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchFromBackend(): Promise<ScenarioSummary[]> {
  await initApiBase();
  const response = await listScenarios();
  return Array.isArray(response.scenarios) ? response.scenarios : [];
}

async function fetchAndStore(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const bundled = await fetchFromBundle();
    if (bundled.length) {
      scenarios.value = bundled;
      loaded = true;
      return;
    }
    scenarios.value = await fetchFromBackend();
    loaded = true;
  } catch (err) {
    if (!scenarios.value.length) scenarios.value = [];
    error.value = err instanceof Error ? err.message : String(err);
    loaded = scenarios.value.length > 0;
  } finally {
    loading.value = false;
    inflight = null;
  }
}

export interface ScenarioCatalogApi {
  scenarios: Ref<ScenarioSummary[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  byCategory: ComputedRef<Record<ScenarioCategory, ScenarioSummary[]>>;
  reload(): Promise<void>;
}

export function useScenarioCatalog(): ScenarioCatalogApi {
  if (!loaded && !inflight) {
    inflight = fetchAndStore();
  }

  const byCategory = computed<Record<ScenarioCategory, ScenarioSummary[]>>(() => {
    const groups: Record<ScenarioCategory, ScenarioSummary[]> = {
      development: [],
      research: [],
      code_quality: [],
      content: [],
      data: [],
      product: [],
      support: [],
      visual_qa: [],
      seo: [],
      custom: [],
    };
    for (const item of scenarios.value) {
      const bucket = groups[item.category];
      if (bucket) bucket.push(item);
    }
    return groups;
  });

  async function reload(): Promise<void> {
    inflight = fetchAndStore();
    await inflight;
  }

  return { scenarios, loading, error, byCategory, reload };
}

export function _resetScenarioCatalogForTests(): void {
  scenarios.value = [];
  loading.value = false;
  error.value = null;
  inflight = null;
  loaded = false;
}
