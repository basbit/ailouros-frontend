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

    <ol v-if="thumbs.records.value.length > 0" class="feedback-thumbs__history">
      <li
        v-for="record in thumbs.records.value"
        :key="record.feedbackId"
        class="feedback-thumbs__record"
      >
        <div class="feedback-thumbs__record-row">
          <span
            class="feedback-thumbs__record-kind"
            :class="`feedback-thumbs__record-kind--${record.kind}`"
            >{{ kindLabel(record.kind) }}</span
          >
          <code class="feedback-thumbs__record-id">{{ record.feedbackId }}</code>
          <button
            v-if="record.chunkIds.length > 0"
            type="button"
            class="feedback-thumbs__promote"
            :disabled="thumbs.promoting.value === record.feedbackId"
            @click="onPromote(record.feedbackId)"
          >
            {{
              thumbs.promoting.value === record.feedbackId
                ? t("feedbackThumbs.promoting")
                : t("feedbackThumbs.promote")
            }}
          </button>
        </div>
        <p class="feedback-thumbs__record-query">{{ record.query }}</p>
      </li>
    </ol>

    <p v-if="thumbs.lastPromotion.value" class="feedback-thumbs__promotion">
      {{
        t("feedbackThumbs.promotedTo", {
          path: thumbs.lastPromotion.value.appendedTo ?? "—",
        })
      }}
    </p>
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

function kindLabel(kind: FeedbackKind): string {
  if (kind === "thumbs_up") return t("feedbackThumbs.kindUp");
  if (kind === "thumbs_down") return t("feedbackThumbs.kindDown");
  return t("feedbackThumbs.kindGolden");
}

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

.feedback-thumbs__promotion {
  font-size: 12px;
  color: var(--success);
  margin: 0;
  word-break: break-all;
}

.feedback-thumbs__history {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feedback-thumbs__record {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 10px;
  background: var(--bg-elev);
}

.feedback-thumbs__record-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.feedback-thumbs__record-kind {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: var(--r-sm);
  font-size: 10px;
}

.feedback-thumbs__record-kind--thumbs_up {
  background: color-mix(in srgb, var(--success) 16%, transparent);
  color: var(--success);
}

.feedback-thumbs__record-kind--thumbs_down {
  background: color-mix(in srgb, var(--warning) 16%, transparent);
  color: var(--warning);
}

.feedback-thumbs__record-kind--mark_as_golden {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
}

.feedback-thumbs__record-id {
  flex: 1 1 auto;
  font-family: var(--font-mono);
  color: var(--ink-3);
}

.feedback-thumbs__promote {
  appearance: none;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 2px 8px;
  font-size: 11px;
  color: var(--accent);
  cursor: pointer;
}

.feedback-thumbs__promote:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-thumbs__record-query {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
}
</style>
