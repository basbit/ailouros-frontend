<template>
  <section v-if="hasManifest" class="visual-artifacts">
    <header class="visual-artifacts__header">
      <span class="visual-artifacts__title">{{ t("page.visualArtifacts") }}</span>
      <span
        v-if="status"
        class="visual-artifacts__status"
        :class="{
          'visual-artifacts__status--passed': status === 'passed',
          'visual-artifacts__status--failed': status === 'failed',
        }"
      >
        {{ status }}
      </span>
    </header>

    <div v-if="summary" class="hint visual-artifacts__summary">{{ summary }}</div>

    <div class="visual-artifacts__links">
      <a v-if="manifestHref" :href="manifestHref" target="_blank" rel="noreferrer">
        {{ t("page.visualOpenManifest") }}
      </a>
    </div>

    <div v-if="screenshots.length" class="visual-artifacts__section">
      <div class="visual-artifacts__subhead">{{ t("page.visualScreenshots") }}</div>
      <div class="visual-artifacts__grid">
        <a
          v-for="shot in screenshots"
          :key="shot.href"
          class="visual-artifacts__shot"
          :href="shot.href"
          target="_blank"
          rel="noreferrer"
        >
          <img :src="shot.href" :alt="shot.label" loading="lazy" />
          <span>{{ shot.label }}</span>
        </a>
      </div>
    </div>

    <div v-if="networkArtifacts.length" class="visual-artifacts__section">
      <div class="visual-artifacts__subhead">{{ t("page.visualHarTrace") }}</div>
      <div class="visual-artifacts__links visual-artifacts__links--wrap">
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
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";

type VisualManifest = Record<string, unknown>;

const props = defineProps<{
  manifest: VisualManifest | null | undefined;
}>();

const { t } = useI18n();

const hasManifest = computed(
  () => !!props.manifest && Object.keys(props.manifest).length > 0,
);

const status = computed(() => String(props.manifest?.status ?? ""));
const summary = computed(() => String(props.manifest?.summary ?? ""));

const manifestHref = computed(() => {
  const url = String(props.manifest?.manifest_url ?? "");
  if (url) return toLink(url);
  return "";
});

const screenshots = computed(() => {
  const pages = Array.isArray(props.manifest?.pages) ? props.manifest.pages : [];
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
      return {
        href: link,
        label: pagePath ? `${viewport} ${pagePath}` : viewport,
      };
    })
    .filter((item): item is { href: string; label: string } => !!item);
});

const networkArtifacts = computed(() => {
  const items: { href: string; label: string }[] = [];
  const pages = Array.isArray(props.manifest?.pages) ? props.manifest.pages : [];
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
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return apiUrl(trimmed);
  return trimmed;
}
</script>

<style scoped>
.visual-artifacts {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 12px;
}

.visual-artifacts__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visual-artifacts__title,
.visual-artifacts__subhead {
  color: var(--text);
  font-size: 12px;
  font-weight: 650;
}

.visual-artifacts__status {
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text2);
  font-size: 11px;
  line-height: 1;
  padding: 4px 6px;
}

.visual-artifacts__status--passed {
  border-color: color-mix(in srgb, var(--success) 45%, transparent);
  color: var(--success);
}

.visual-artifacts__status--failed {
  border-color: color-mix(in srgb, var(--error) 45%, transparent);
  color: var(--error);
}

.visual-artifacts__summary {
  margin-top: 6px;
  white-space: pre-wrap;
}

.visual-artifacts__links {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.visual-artifacts__links--wrap {
  flex-wrap: wrap;
}

.visual-artifacts__section {
  margin-top: 12px;
}

.visual-artifacts__grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  margin-top: 8px;
}

.visual-artifacts__shot {
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text2);
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 6px;
  overflow: hidden;
  text-decoration: none;
}

.visual-artifacts__shot img {
  aspect-ratio: 16 / 10;
  background: var(--surface2);
  display: block;
  object-fit: cover;
  width: 100%;
}

.visual-artifacts__shot span {
  padding: 0 8px 8px;
  overflow-wrap: anywhere;
}
</style>
