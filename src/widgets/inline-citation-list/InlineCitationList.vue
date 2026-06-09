<template>
  <section
    v-if="history.length > 0"
    class="inline-citation-list"
    :aria-label="t('inlineCitations.listAria')"
  >
    <header class="inline-citation-list__header">
      <h3 class="inline-citation-list__title">
        {{ t("inlineCitations.headline") }}
      </h3>
      <span class="inline-citation-list__count">{{ history.length }}</span>
    </header>
    <ol class="inline-citation-list__items">
      <li
        v-for="citation in history"
        :key="citation.chunkId"
        class="inline-citation-list__item"
        :class="{
          'inline-citation-list__item--missing': !citation.found,
        }"
      >
        <div class="inline-citation-list__row">
          <code class="inline-citation-list__id">{{ citation.chunkId }}</code>
          <span
            v-if="!citation.found"
            class="inline-citation-list__badge inline-citation-list__badge--missing"
          >
            {{ t("inlineCitations.missing") }}
          </span>
          <span
            v-else
            class="inline-citation-list__badge inline-citation-list__badge--found"
          >
            {{ t("inlineCitations.found") }}
          </span>
        </div>
        <p
          v-if="citation.relPath || citation.section"
          class="inline-citation-list__location"
        >
          <span v-if="citation.relPath">{{ citation.relPath }}</span>
          <span v-if="citation.section">#{{ citation.section }}</span>
        </p>
        <p v-if="citation.snippet" class="inline-citation-list__snippet">
          {{ citation.snippet }}
        </p>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useInlineCitations } from "@/features/inline-citations/useInlineCitations";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const citations = useInlineCitations();
const history = computed(() => citations.history.value);
</script>

<style scoped>
.inline-citation-list {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inline-citation-list__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inline-citation-list__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.inline-citation-list__count {
  font-size: 11px;
  color: var(--ink-3);
  background: var(--bg-elev);
  padding: 2px 6px;
  border-radius: var(--r-sm);
}

.inline-citation-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inline-citation-list__item {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 8px 10px;
  background: var(--bg-elev);
}

.inline-citation-list__item--missing {
  border-color: color-mix(in srgb, var(--warning) 35%, var(--line));
}

.inline-citation-list__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.inline-citation-list__id {
  flex: 1 1 auto;
  color: var(--ink);
  font-family: var(--font-mono);
  word-break: break-all;
}

.inline-citation-list__badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: var(--r-sm);
}

.inline-citation-list__badge--found {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}

.inline-citation-list__badge--missing {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 16%, transparent);
}

.inline-citation-list__location {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--ink-3);
  display: flex;
  gap: 6px;
}

.inline-citation-list__snippet {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
  white-space: pre-wrap;
}
</style>
