<template>
  <section class="visual-tab" :aria-label="t('history.detail.tab.visual')">
    <header class="visual-tab__head">
      <span class="visual-tab__title">{{ t("visualTab.title") }}</span>
      <span
        v-if="status"
        class="visual-tab__status"
        :class="`visual-tab__status--${status}`"
      >
        {{ status }}
      </span>

      <!-- Subtab Selector -->
      <div class="visual-tab__subtabs">
        <button
          type="button"
          class="visual-tab__subtab-btn"
          :class="{ 'visual-tab__subtab-btn--active': subTab === 'manifest' }"
          @click="subTab = 'manifest'"
        >
          {{ t("visualTab.reportTab") }}
        </button>
        <button
          type="button"
          class="visual-tab__subtab-btn"
          :class="{ 'visual-tab__subtab-btn--active': subTab === 'screencast' }"
          @click="subTab = 'screencast'"
        >
          {{ t("liveBrowser.title") }}
        </button>
      </div>
    </header>

    <!-- Live Browser Screencast Viewport -->
    <div v-if="subTab === 'screencast' && taskId" class="visual-tab__screencast-wrap">
      <LiveBrowserViewport :task-id="taskId" />
    </div>

    <!-- Static Test Evidence Manifest -->
    <template v-else>
      <div v-if="loading" class="visual-tab__hint">{{ t("visualTab.loading") }}</div>
      <div v-else-if="error" class="visual-tab__error">{{ error }}</div>
      <div v-else-if="!hasManifest" class="visual-tab__hint">
        {{ t("visualTab.empty") }}
      </div>
      <template v-else>
        <div v-if="summary" class="visual-tab__summary">{{ summary }}</div>

        <div v-if="screenshots.length" class="visual-tab__section">
          <div class="visual-tab__subhead">
            {{ t("visualTab.screenshots") }} ({{ screenshots.length }})
          </div>
          <div class="visual-tab__grid">
            <figure
              v-for="shot in screenshots"
              :key="shot.href"
              class="visual-tab__shot"
            >
              <a
                :href="shot.href"
                target="_blank"
                rel="noreferrer"
                class="visual-tab__shot-link"
              >
                <img :src="shot.href" :alt="shot.label" loading="lazy" />
              </a>
              <figcaption class="visual-tab__shot-label">{{ shot.label }}</figcaption>
            </figure>
          </div>
        </div>

        <div v-if="baselineComparisons.length" class="visual-tab__section">
          <div class="visual-tab__subhead">
            {{ t("visualTab.baselines") }} ({{ baselineComparisons.length }})
          </div>
          <VisualDiffViewer
            v-for="comparison in baselineComparisons"
            :key="`${comparison.page}-${comparison.viewport}`"
            :title="`${comparison.page} — ${comparison.viewport}`"
            :baseline-url="comparison.baselineUrl"
            :current-url="comparison.currentUrl"
            :diff-url="comparison.diffUrl"
            :mismatch-percentage="comparison.diffPercent"
            :diff-pixels="comparison.diffPixels"
            :can-approve="false"
          />
        </div>

        <div v-if="networkArtifacts.length" class="visual-tab__section">
          <div class="visual-tab__subhead">{{ t("visualTab.harTrace") }}</div>
          <div class="visual-tab__links">
            <a
              v-for="item in networkArtifacts"
              :key="item.href"
              :href="item.href"
              target="_blank"
              rel="noreferrer"
            >
              {{ item.label }}
            </a>
          </div>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { apiUrl } from "@/shared/api/base";
import { getTaskPipelinePlan } from "@/shared/api/endpoints/pipeline";
import { useI18n } from "@/shared/lib/i18n";
import VisualDiffViewer from "@/widgets/visual-testing/VisualDiffViewer.vue";
import LiveBrowserViewport from "@/widgets/browser-viewport/LiveBrowserViewport.vue";

const props = defineProps<{ taskId: string | null }>();

const { t } = useI18n();

const subTab = ref<"screencast" | "manifest">("screencast");
const manifest = ref<Record<string, unknown> | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const hasManifest = computed(
  () => !!manifest.value && Object.keys(manifest.value).length > 0,
);
const status = computed(() => String(manifest.value?.status ?? ""));
const summary = computed(() => String(manifest.value?.summary ?? ""));

interface Shot {
  href: string;
  label: string;
}

const screenshots = computed<Shot[]>(() => {
  const pages = Array.isArray(manifest.value?.pages) ? manifest.value.pages : [];
  return pages
    .map((page) => {
      if (!page || typeof page !== "object") return null;
      const pageData = page as Record<string, unknown>;
      const screenshot = pageData.screenshot;
      if (!screenshot || typeof screenshot !== "object") return null;
      const screenshotData = screenshot as Record<string, unknown>;
      const link = toLink(String(screenshotData.url || ""));
      if (!link) return null;
      const viewport = String(
        pageData.viewport || screenshotData.viewport || "viewport",
      );
      const pagePath = String(pageData.page_path || pageData.url || "");
      return { href: link, label: pagePath ? `${viewport} ${pagePath}` : viewport };
    })
    .filter((item): item is Shot => !!item);
});

interface BaselineComparison {
  page: string;
  viewport: string;
  baselineUrl: string | null;
  currentUrl: string;
  diffUrl: string | null;
  diffPercent: number;
  diffPixels: number;
}

const baselineComparisons = computed<BaselineComparison[]>(() => {
  const raw = manifest.value?.baseline_comparisons;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const data = entry as Record<string, unknown>;
      const currentUrl = toLink(String(data.current_url || ""));
      if (!currentUrl) return null;
      return {
        page: String(data.page || ""),
        viewport: String(data.viewport || ""),
        baselineUrl: toLink(String(data.baseline_url || "")) || null,
        currentUrl,
        diffUrl: toLink(String(data.diff_url || "")) || null,
        diffPercent: Number(data.diff_percent ?? 0),
        diffPixels: Number(data.diff_pixels ?? 0),
      };
    })
    .filter((item): item is BaselineComparison => !!item);
});

const networkArtifacts = computed<{ href: string; label: string }[]>(() => {
  const items: { href: string; label: string }[] = [];
  const pages = Array.isArray(manifest.value?.pages) ? manifest.value.pages : [];
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const pageData = page as Record<string, unknown>;
    const viewportLabel = String(pageData.viewport || "viewport");
    const pagePath = String(pageData.page_path || pageData.url || "");
    const displayLabel = pagePath ? `${viewportLabel} ${pagePath}` : viewportLabel;
    const harLink = toLink(String(pageData.har_url || ""));
    if (harLink) items.push({ href: harLink, label: `HAR ${displayLabel}` });
    const traceLink = toLink(String(pageData.trace_url || ""));
    if (traceLink) items.push({ href: traceLink, label: `trace ${displayLabel}` });
  }
  return items;
});

function toLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return apiUrl(trimmed);
  return trimmed;
}

async function load(): Promise<void> {
  if (!props.taskId) {
    manifest.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const plan = await getTaskPipelinePlan(props.taskId);
    const direct = plan.visual_probe_manifest;
    const partial = (plan.partial_state as Record<string, unknown> | undefined)
      ?.visual_probe_manifest;
    manifest.value = (direct ?? partial ?? null) as Record<string, unknown> | null;
    if (manifest.value && Object.keys(manifest.value).length > 0) {
      subTab.value = "manifest";
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    manifest.value = null;
  } finally {
    loading.value = false;
  }
}

onMounted(() => void load());
watch(
  () => props.taskId,
  () => void load(),
);
</script>

<style scoped>
.visual-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.visual-tab__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.visual-tab__title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}
.visual-tab__status {
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink-3);
  font-size: 11px;
  line-height: 1;
  padding: 4px 6px;
}
.visual-tab__status--passed {
  border-color: color-mix(in srgb, var(--ok) 45%, transparent);
  color: var(--ok);
}
.visual-tab__status--failed {
  border-color: color-mix(in srgb, var(--error) 45%, transparent);
  color: var(--error);
}
.visual-tab__hint,
.visual-tab__error {
  font-size: 12px;
  color: var(--ink-3);
}
.visual-tab__error {
  color: var(--error);
}
.visual-tab__summary {
  font-size: 12px;
  white-space: pre-wrap;
  color: var(--ink);
}
.visual-tab__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.visual-tab__subhead {
  font-size: 12px;
  font-weight: 650;
  color: var(--ink);
}
.visual-tab__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
.visual-tab__shot {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.visual-tab__shot-link {
  display: block;
  background: var(--bg-2);
}
.visual-tab__shot img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}
.visual-tab__shot-label {
  font-size: 11px;
  color: var(--ink-3);
  padding: 6px 8px;
  overflow-wrap: anywhere;
}
.visual-tab__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.visual-tab__links a {
  font-size: 12px;
  color: var(--accent);
}

.visual-tab__subtabs {
  display: inline-flex;
  margin-left: auto;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 2px;
  gap: 2px;
}

.visual-tab__subtab-btn {
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 550;
  padding: 4px 10px;
  border-radius: 4px;
  color: var(--ink-3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.visual-tab__subtab-btn:hover {
  color: var(--ink);
}

.visual-tab__subtab-btn--active {
  background: var(--card);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}

.visual-tab__screencast-wrap {
  width: 100%;
  height: calc(100vh - 240px);
  min-height: 460px;
  max-height: 760px;
}
</style>
