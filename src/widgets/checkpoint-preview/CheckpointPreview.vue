<template>
  <section
    v-if="parsed"
    class="checkpoint-preview"
    :aria-label="t('checkpointPreview.cardAria')"
  >
    <header class="checkpoint-preview__header">
      <h3 class="checkpoint-preview__title">{{ t("checkpointPreview.headline") }}</h3>
      <p class="checkpoint-preview__lead">{{ t("checkpointPreview.lead") }}</p>
    </header>

    <div v-if="parsed.riskHotspots.length" class="checkpoint-preview__hotspots">
      <h4 class="checkpoint-preview__section">{{ t("checkpointPreview.hotspots") }}</h4>
      <ul class="checkpoint-preview__list">
        <li v-for="(hotspot, index) in parsed.riskHotspots" :key="`hot-${index}`">
          <span v-if="hotspot.severity" class="checkpoint-preview__severity">
            {{ hotspot.severity }}
          </span>
          <span class="checkpoint-preview__what">{{ hotspot.what }}</span>
          <span v-if="hotspot.where.length" class="checkpoint-preview__where">
            {{ hotspot.where.join(", ") }}
          </span>
          <span
            v-for="tag in hotspot.tags"
            :key="`hot-${index}-${tag}`"
            class="checkpoint-preview__tag"
            >{{ tag }}</span
          >
        </li>
      </ul>
    </div>

    <div v-if="parsed.concerns.length" class="checkpoint-preview__concerns">
      <h4 class="checkpoint-preview__section">{{ t("checkpointPreview.concerns") }}</h4>
      <ul class="checkpoint-preview__list">
        <li v-for="concern in parsed.concerns" :key="concern.path">
          <code class="checkpoint-preview__path">{{ concern.path }}</code>
          <span
            v-for="tag in concern.tags"
            :key="`${concern.path}-${tag}`"
            class="checkpoint-preview__tag"
            >{{ tag }}</span
          >
        </li>
      </ul>
    </div>

    <div v-if="parsed.manualChecks.length" class="checkpoint-preview__checks">
      <h4 class="checkpoint-preview__section">
        {{ t("checkpointPreview.manualChecks") }}
      </h4>
      <ol class="checkpoint-preview__list">
        <li v-for="(check, index) in parsed.manualChecks" :key="`check-${index}`">
          <span class="checkpoint-preview__do">{{ check.do }}</span>
          <span class="checkpoint-preview__expect">
            {{ t("checkpointPreview.manualExpect") }}: {{ check.expect }}
          </span>
        </li>
      </ol>
    </div>

    <div v-if="parsed.deferred.length" class="checkpoint-preview__deferred">
      <h4 class="checkpoint-preview__section">{{ t("checkpointPreview.deferred") }}</h4>
      <ul class="checkpoint-preview__list">
        <li v-for="(entry, index) in parsed.deferred" :key="`deferred-${index}`">
          <span class="checkpoint-preview__what">{{ entry.title }}</span>
          <span v-if="entry.stepId" class="checkpoint-preview__where">{{
            entry.stepId
          }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { parseCheckpointPreview } from "@/shared/model/checkpoint-preview-types";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ preview: unknown }>();

const { t } = useI18n();

const parsed = computed(() => parseCheckpointPreview(props.preview));
</script>

<style scoped>
.checkpoint-preview {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.checkpoint-preview__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkpoint-preview__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.checkpoint-preview__lead {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.checkpoint-preview__section {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}

.checkpoint-preview__list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--ink);
}

.checkpoint-preview__list li {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
}

.checkpoint-preview__severity {
  font-size: 11px;
  font-weight: 600;
  color: var(--danger, #b3261e);
}

.checkpoint-preview__where,
.checkpoint-preview__expect {
  font-size: 12px;
  color: var(--muted);
}

.checkpoint-preview__path {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.checkpoint-preview__tag {
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 10px;
  color: var(--muted);
}

.checkpoint-preview__deferred {
  opacity: 0.75;
}
</style>
