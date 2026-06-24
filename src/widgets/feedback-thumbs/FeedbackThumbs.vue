<template>
  <section class="feedback-thumbs" :aria-label="t('feedbackThumbs.cardAria')">
    <header class="feedback-thumbs__header">
      <h3 class="feedback-thumbs__title">
        {{ t("feedbackThumbs.headline") }}
      </h3>
      <p class="feedback-thumbs__hint">
        {{ t("feedbackThumbs.hint") }}
      </p>
    </header>

    <div class="feedback-thumbs__inputs">
      <label class="feedback-thumbs__label">
        {{ t("feedbackThumbs.queryLabel") }}
        <input
          v-model.trim="query"
          type="text"
          class="feedback-thumbs__input"
          :placeholder="t('feedbackThumbs.queryPlaceholder')"
        />
      </label>

      <details class="feedback-thumbs__details">
        <summary class="feedback-thumbs__summary">
          {{ t("feedbackThumbs.optionalFields") }}
        </summary>
        <label class="feedback-thumbs__label">
          {{ t("feedbackThumbs.rationaleLabel") }}
          <textarea
            v-model.trim="rationale"
            class="feedback-thumbs__textarea"
            rows="3"
            :placeholder="t('feedbackThumbs.rationalePlaceholder')"
          />
        </label>
        <label class="feedback-thumbs__label">
          {{ t("feedbackThumbs.chunkIdsLabel") }}
          <input
            v-model.trim="chunkIdsRaw"
            type="text"
            class="feedback-thumbs__input"
            :placeholder="t('feedbackThumbs.chunkIdsPlaceholder')"
          />
        </label>
      </details>
    </div>

    <div class="feedback-thumbs__actions">
      <button
        type="button"
        class="feedback-thumbs__btn feedback-thumbs__btn--up"
        :disabled="!canSubmit"
        @click="onSubmit('thumbs_up')"
      >
        <span aria-hidden="true">👍</span>
        {{ t("feedbackThumbs.thumbsUp") }}
      </button>
      <button
        type="button"
        class="feedback-thumbs__btn feedback-thumbs__btn--down"
        :disabled="!canSubmit"
        @click="onSubmit('thumbs_down')"
      >
        <span aria-hidden="true">👎</span>
        {{ t("feedbackThumbs.thumbsDown") }}
      </button>
      <button
        type="button"
        class="feedback-thumbs__btn feedback-thumbs__btn--golden"
        :disabled="!canSubmit || chunkIdsParsed.length === 0"
        :title="
          chunkIdsParsed.length === 0 ? t('feedbackThumbs.goldenNeedsChunks') : ''
        "
        @click="onSubmit('mark_as_golden')"
      >
        <span aria-hidden="true">⭐</span>
        {{ t("feedbackThumbs.markAsGolden") }}
      </button>
    </div>

    <p v-if="thumbs.lastError.value" class="feedback-thumbs__error">
      {{ thumbs.lastError.value }}
    </p>

    <FeedbackThumbsHistory
      :records="thumbs.records.value"
      :promoting="thumbs.promoting.value"
      :last-promotion="thumbs.lastPromotion.value"
      @promote="onPromote"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import {
  type FeedbackKind,
  type RetrievalFeedback,
} from "@/entities/retrieval-feedback";
import { useFeedbackThumbs } from "@/features/feedback-thumbs/useFeedbackThumbs";
import { useI18n } from "@/shared/lib/i18n";
import { useUiStore } from "@/shared/store/ui";
import FeedbackThumbsHistory from "./FeedbackThumbsHistory.vue";

const { t } = useI18n();
const ui = useUiStore();
const thumbs = useFeedbackThumbs();

const query = ref("");
const rationale = ref("");
const chunkIdsRaw = ref("");

const workspaceRoot = computed(
  () =>
    ui.historyList.find((entry) => entry.taskId === ui.taskId)?.workspace_root ?? "",
);

const chunkIdsParsed = computed<string[]>(() =>
  chunkIdsRaw.value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0),
);

const canSubmit = computed(
  () =>
    query.value.length > 0 && Boolean(workspaceRoot.value) && !thumbs.submitting.value,
);

async function onSubmit(kind: FeedbackKind): Promise<void> {
  if (!canSubmit.value) return;
  const record: RetrievalFeedback | null = await thumbs.submit({
    workspaceRoot: workspaceRoot.value,
    kind,
    query: query.value,
    rationale: rationale.value,
    chunkIds: chunkIdsParsed.value,
  });
  if (record) {
    query.value = "";
    rationale.value = "";
    chunkIdsRaw.value = "";
  }
}

async function onPromote(feedbackId: string): Promise<void> {
  if (!workspaceRoot.value) return;
  await thumbs.promoteToGolden(feedbackId, workspaceRoot.value);
}
</script>

<style scoped>
.feedback-thumbs {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feedback-thumbs__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.feedback-thumbs__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.feedback-thumbs__hint {
  font-size: 12px;
  color: var(--ink-3);
  margin: 0;
}

.feedback-thumbs__inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feedback-thumbs__label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-3);
}

.feedback-thumbs__input,
.feedback-thumbs__textarea {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  font-family: inherit;
  resize: vertical;
}

.feedback-thumbs__details {
  font-size: 12px;
}

.feedback-thumbs__summary {
  cursor: pointer;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.feedback-thumbs__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feedback-thumbs__btn {
  appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  color: var(--ink);
  border-radius: var(--r-md);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.feedback-thumbs__btn:hover:not(:disabled) {
  border-color: var(--line-strong);
}

.feedback-thumbs__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.feedback-thumbs__btn--up:not(:disabled) {
  border-color: color-mix(in srgb, var(--success) 30%, var(--line));
}

.feedback-thumbs__btn--down:not(:disabled) {
  border-color: color-mix(in srgb, var(--warning) 30%, var(--line));
}

.feedback-thumbs__btn--golden:not(:disabled) {
  border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
}

.feedback-thumbs__error {
  font-size: 12px;
  color: var(--error);
  margin: 0;
}
</style>
