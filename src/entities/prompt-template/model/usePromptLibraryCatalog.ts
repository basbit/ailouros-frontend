import { ref } from "vue";
import type { Ref } from "vue";
import { initApiBase } from "@/shared/api/base";
import { listPromptTemplates } from "@/shared/api/endpoints/prompt-library";
import type {
  PromptPackSummary,
  PromptTemplateSummary,
} from "@/entities/prompt-template/model/types";

const packs = ref<PromptPackSummary[]>([]);
const templates = ref<PromptTemplateSummary[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let inflight: Promise<void> | null = null;
let loaded = false;

async function loadCatalog(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    await initApiBase();
    const response = await listPromptTemplates();
    packs.value = response.packs ?? [];
    templates.value = response.templates ?? [];
    loaded = true;
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    loading.value = false;
    inflight = null;
  }
}

export interface PromptLibraryCatalogApi {
  packs: Ref<PromptPackSummary[]>;
  templates: Ref<PromptTemplateSummary[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  reload(): Promise<void>;
  ensureLoaded(): Promise<void>;
}

export function usePromptLibraryCatalog(): PromptLibraryCatalogApi {
  if (!loaded && !inflight) {
    inflight = loadCatalog();
  }
  return {
    packs,
    templates,
    loading,
    error,
    async reload() {
      inflight = loadCatalog();
      await inflight;
    },
    async ensureLoaded() {
      if (inflight) await inflight;
      else if (!loaded) {
        inflight = loadCatalog();
        await inflight;
      }
    },
  };
}

export function _resetPromptLibraryCatalogForTests(): void {
  packs.value = [];
  templates.value = [];
  loading.value = false;
  error.value = null;
  inflight = null;
  loaded = false;
}
