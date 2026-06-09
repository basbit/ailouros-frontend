<template>
  <section
    v-if="event"
    class="streaming-rag-card"
    :aria-label="t('streamingRag.cardAria')"
  >
    <header class="streaming-rag-card__header">
      <div class="streaming-rag-card__title-row">
        <span class="streaming-rag-card__badge">RAG</span>
        <h3 class="streaming-rag-card__title">
          {{ t("streamingRag.headline") }}
        </h3>
      </div>
      <p class="streaming-rag-card__meta">
        <span class="streaming-rag-card__meta-item">
          <span class="streaming-rag-card__meta-label">{{
            t("streamingRag.namespace")
          }}</span>
          <code class="streaming-rag-card__meta-value">{{
            event.namespace || "—"
          }}</code>
        </span>
        <span class="streaming-rag-card__meta-item">
          <span class="streaming-rag-card__meta-label">{{
            t("streamingRag.elapsed")
          }}</span>
          <span class="streaming-rag-card__meta-value">{{
            formatElapsed(event.elapsedMs)
          }}</span>
        </span>
        <span class="streaming-rag-card__meta-item">
          <span class="streaming-rag-card__meta-label">{{
            t("streamingRag.chunkCount")
          }}</span>
          <span class="streaming-rag-card__meta-value">{{ event.chunks.length }}</span>
        </span>
      </p>
      <p v-if="event.query" class="streaming-rag-card__query">
        <span class="streaming-rag-card__query-label">{{
          t("streamingRag.query")
        }}</span>
        <span class="streaming-rag-card__query-text">{{ event.query }}</span>
      </p>
    </header>

    <ol v-if="event.chunks.length > 0" class="streaming-rag-card__chunks">
      <li
        v-for="(chunk, index) in event.chunks"
        :key="chunk.chunkId"
        class="streaming-rag-card__chunk"
      >
        <div class="streaming-rag-card__chunk-head">
          <span class="streaming-rag-card__chunk-rank">{{ index + 1 }}</span>
          <code class="streaming-rag-card__chunk-id">{{ chunk.chunkId }}</code>
          <span class="streaming-rag-card__chunk-score">{{
            formatScore(chunk.score)
          }}</span>
        </div>
        <p v-if="chunk.relPath || chunk.section" class="streaming-rag-card__chunk-loc">
          <span v-if="chunk.relPath">{{ chunk.relPath }}</span>
          <span v-if="chunk.section">#{{ chunk.section }}</span>
        </p>
        <p v-if="chunk.snippet" class="streaming-rag-card__chunk-snippet">
          {{ chunk.snippet }}
        </p>
      </li>
    </ol>
    <p v-else class="streaming-rag-card__empty">
      {{ t("streamingRag.emptyChunks") }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useStreamingRagCard } from "@/features/streaming-rag/useStreamingRagCard";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const { latest } = useStreamingRagCard();
const event = computed(() => latest.value);

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatScore(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(3);
}
</script>

<style scoped>
.streaming-rag-card {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.streaming-rag-card__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.streaming-rag-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.streaming-rag-card__badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: var(--r-sm);
}

.streaming-rag-card__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.streaming-rag-card__meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
}

.streaming-rag-card__meta-item {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  color: var(--ink-3);
}

.streaming-rag-card__meta-label {
  color: var(--ink-4);
}

.streaming-rag-card__meta-value {
  color: var(--ink);
  font-weight: 500;
}

.streaming-rag-card__query {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-2);
  display: flex;
  gap: 6px;
}

.streaming-rag-card__query-label {
  color: var(--ink-4);
}

.streaming-rag-card__query-text {
  color: var(--ink);
}

.streaming-rag-card__chunks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.streaming-rag-card__chunk {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 8px 10px;
  background: var(--bg-elev);
}

.streaming-rag-card__chunk-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.streaming-rag-card__chunk-rank {
  font-weight: 600;
  color: var(--ink-2);
  min-width: 18px;
}

.streaming-rag-card__chunk-id {
  font-family: var(--font-mono);
  color: var(--ink);
  word-break: break-all;
  flex: 1 1 auto;
}

.streaming-rag-card__chunk-score {
  color: var(--ink-3);
  white-space: nowrap;
}

.streaming-rag-card__chunk-loc {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--ink-3);
  display: flex;
  gap: 6px;
}

.streaming-rag-card__chunk-snippet {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
  white-space: pre-wrap;
}

.streaming-rag-card__empty {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  font-style: italic;
}
</style>
