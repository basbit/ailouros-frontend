<template>
  <section v-if="grouped.length" class="scenario-shots">
    <header class="scenario-shots__head">
      <span class="scenario-shots__title">{{ t("scenarioShots.title") }}</span>
      <span class="scenario-shots__count">{{ totalCount }}</span>
    </header>
    <div
      v-for="bucket in grouped"
      :key="bucket.viewport"
      class="scenario-shots__bucket"
    >
      <div class="scenario-shots__bucket-label">
        {{ t("scenarioShots.viewport", { viewport: bucket.viewport }) }}
      </div>
      <div class="scenario-shots__grid">
        <a
          v-for="(shot, index) in bucket.items"
          :key="`${bucket.viewport}-${index}`"
          class="scenario-shots__item"
          :href="resolveLink(shot.url)"
          target="_blank"
          rel="noreferrer"
        >
          <img :src="resolveLink(shot.url)" :alt="shot.label" loading="lazy" />
          <span>{{ shot.label }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";

interface Shot {
  url: string;
  viewport: string;
  label: string;
}

interface Bucket {
  viewport: string;
  items: Shot[];
}

const props = defineProps<{
  visualManifest: Record<string, unknown> | null | undefined;
}>();

const { t } = useI18n();

const shots = computed<Shot[]>(() => {
  const manifest = props.visualManifest;
  if (!manifest || typeof manifest !== "object") return [];
  const pages = Array.isArray((manifest as Record<string, unknown>).pages)
    ? ((manifest as Record<string, unknown>).pages as unknown[])
    : [];
  const out: Shot[] = [];
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const pageData = page as Record<string, unknown>;
    const screenshot = pageData.screenshot;
    if (!screenshot || typeof screenshot !== "object") continue;
    const screenshotData = screenshot as Record<string, unknown>;
    const url = String(screenshotData.url || "");
    if (!url) continue;
    const viewport = String(pageData.viewport || screenshotData.viewport || "viewport");
    const pagePath = String(pageData.page_path || pageData.url || "");
    out.push({
      url,
      viewport,
      label: pagePath || viewport,
    });
  }
  return out;
});

const grouped = computed<Bucket[]>(() => {
  const byViewport = new Map<string, Shot[]>();
  for (const shot of shots.value) {
    const list = byViewport.get(shot.viewport) ?? [];
    list.push(shot);
    byViewport.set(shot.viewport, list);
  }
  return Array.from(byViewport.entries()).map(([viewport, items]) => ({
    viewport,
    items,
  }));
});

const totalCount = computed(() => shots.value.length);

function resolveLink(value: string): string {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return apiUrl(value);
  return value;
}
</script>

<style scoped>
.scenario-shots {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 12px;
}
.scenario-shots__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.scenario-shots__title {
  font-size: 12px;
  font-weight: 650;
}
.scenario-shots__count {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.scenario-shots__bucket {
  margin-bottom: 8px;
}
.scenario-shots__bucket-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
  margin-bottom: 4px;
}
.scenario-shots__grid {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}
.scenario-shots__item {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  overflow: hidden;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  font-size: 10px;
  color: var(--text2, #a8b0c4);
}
.scenario-shots__item img {
  aspect-ratio: 16 / 10;
  object-fit: cover;
  width: 100%;
  background: var(--surface2, #14171f);
}
.scenario-shots__item span {
  padding: 4px 6px;
  overflow-wrap: anywhere;
}
</style>
