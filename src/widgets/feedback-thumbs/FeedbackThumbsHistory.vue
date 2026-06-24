<template>
  <div class="feedback-history">
    <ol v-if="records.length > 0" class="feedback-history__list">
      <li
        v-for="record in records"
        :key="record.feedbackId"
        class="feedback-history__record"
      >
        <div class="feedback-history__record-row">
          <span
            class="feedback-history__record-kind"
            :class="`feedback-history__record-kind--${record.kind}`"
            >{{ kindLabel(record.kind) }}</span
          >
          <code class="feedback-history__record-id">{{ record.feedbackId }}</code>
          <button
            v-if="record.chunkIds.length > 0"
            type="button"
            class="feedback-history__promote"
            :disabled="promoting === record.feedbackId"
            @click="emit('promote', record.feedbackId)"
          >
            {{
              promoting === record.feedbackId
                ? t("feedbackThumbs.promoting")
                : t("feedbackThumbs.promote")
            }}
          </button>
        </div>
        <p class="feedback-history__record-query">{{ record.query }}</p>
      </li>
    </ol>

    <p v-if="lastPromotion" class="feedback-history__promotion">
      {{
        t("feedbackThumbs.promotedTo", {
          path: lastPromotion.appendedTo ?? "—",
        })
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { type FeedbackKind } from "@/entities/retrieval-feedback";
import { useI18n } from "@/shared/lib/i18n";

interface FeedbackRecordView {
  feedbackId: string;
  kind: FeedbackKind;
  query: string;
  chunkIds: readonly string[];
}

defineProps<{
  records: readonly FeedbackRecordView[];
  promoting: string | null;
  lastPromotion: { appendedTo: string | null } | null;
}>();

const emit = defineEmits<{
  promote: [feedbackId: string];
}>();

const { t } = useI18n();

function kindLabel(kind: FeedbackKind): string {
  if (kind === "thumbs_up") return t("feedbackThumbs.kindUp");
  if (kind === "thumbs_down") return t("feedbackThumbs.kindDown");
  return t("feedbackThumbs.kindGolden");
}
</script>

<style scoped>
.feedback-history {
  display: contents;
}

.feedback-history__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feedback-history__record {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 10px;
  background: var(--bg-elev);
}

.feedback-history__record-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.feedback-history__record-kind {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: var(--r-sm);
  font-size: 10px;
}

.feedback-history__record-kind--thumbs_up {
  background: color-mix(in srgb, var(--success) 16%, transparent);
  color: var(--success);
}

.feedback-history__record-kind--thumbs_down {
  background: color-mix(in srgb, var(--warning) 16%, transparent);
  color: var(--warning);
}

.feedback-history__record-kind--mark_as_golden {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
}

.feedback-history__record-id {
  flex: 1 1 auto;
  font-family: var(--font-mono);
  color: var(--ink-3);
}

.feedback-history__promote {
  appearance: none;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 2px 8px;
  font-size: 11px;
  color: var(--accent);
  cursor: pointer;
}

.feedback-history__promote:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-history__record-query {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
}

.feedback-history__promotion {
  font-size: 12px;
  color: var(--success);
  margin: 0;
  word-break: break-all;
}
</style>
