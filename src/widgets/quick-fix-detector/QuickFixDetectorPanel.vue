<template>
  <section class="quick-fix-panel" :aria-label="t('quickFix.cardAria')">
    <header class="quick-fix-panel__header">
      <h3 class="quick-fix-panel__title">{{ t("quickFix.headline") }}</h3>
    </header>

    <label class="quick-fix-panel__field">
      {{ t("quickFix.descriptionLabel") }}
      <textarea
        v-model="description"
        rows="2"
        class="quick-fix-panel__textarea"
        :placeholder="t('quickFix.descriptionPlaceholder')"
      />
    </label>

    <label class="quick-fix-panel__field">
      {{ t("quickFix.filesLabel") }}
      <textarea
        v-model="filesRaw"
        rows="2"
        class="quick-fix-panel__textarea"
        :placeholder="t('quickFix.filesPlaceholder')"
      />
    </label>

    <label class="quick-fix-panel__field quick-fix-panel__field--row">
      {{ t("quickFix.locLabel") }}
      <input
        v-model.number="estimatedLoc"
        type="number"
        min="0"
        class="quick-fix-panel__loc"
      />
    </label>

    <div class="quick-fix-panel__actions">
      <button
        type="button"
        class="quick-fix-panel__btn"
        :disabled="!canRun"
        @click="onRun"
      >
        {{ detector.loading.value ? t("quickFix.running") : t("quickFix.run") }}
      </button>
      <button
        type="button"
        class="quick-fix-panel__btn quick-fix-panel__btn--ghost"
        :disabled="!decision"
        @click="detector.clear"
      >
        {{ t("quickFix.clear") }}
      </button>
    </div>

    <p v-if="detector.lastError.value" class="quick-fix-panel__error">
      {{ detector.lastError.value }}
    </p>

    <div v-if="decision" class="quick-fix-panel__decision">
      <span
        class="quick-fix-panel__verdict"
        :class="`quick-fix-panel__verdict--${decision.verdict}`"
      >
        {{ t(`quickFix.verdict.${decision.verdict}`) }}
      </span>
      <p class="quick-fix-panel__reason">{{ decision.reason }}</p>
      <p class="quick-fix-panel__meta">
        {{ t("quickFix.meta", { maxLoc: decision.maxLoc }) }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { useQuickFix } from "@/features/quick-fix/useQuickFix";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const detector = useQuickFix();
const description = ref("");
const filesRaw = ref("");
const estimatedLoc = ref(0);
const decision = computed(() => detector.decision.value);

const parsedFiles = computed(() =>
  filesRaw.value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0),
);

const canRun = computed(
  () =>
    !detector.loading.value &&
    description.value.trim().length > 0 &&
    parsedFiles.value.length > 0,
);

async function onRun(): Promise<void> {
  if (!canRun.value) return;
  await detector.run({
    description: description.value,
    targetFiles: parsedFiles.value,
    estimatedLoc: estimatedLoc.value,
  });
}
</script>

<style scoped>
.quick-fix-panel {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-fix-panel__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.quick-fix-panel__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-3);
}

.quick-fix-panel__field--row {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.quick-fix-panel__textarea {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  font-family: inherit;
  resize: vertical;
}

.quick-fix-panel__loc {
  width: 80px;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 6px;
  font-size: 13px;
  color: var(--ink);
}

.quick-fix-panel__actions {
  display: flex;
  gap: 8px;
}

.quick-fix-panel__btn {
  appearance: none;
  background: var(--accent);
  color: #fff;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
}

.quick-fix-panel__btn--ghost {
  background: transparent;
  color: var(--ink-2);
  border-color: var(--line);
}

.quick-fix-panel__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quick-fix-panel__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.quick-fix-panel__decision {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quick-fix-panel__verdict {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.quick-fix-panel__verdict--accept {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 14%, transparent);
}

.quick-fix-panel__verdict--reject {
  color: var(--error);
  background: color-mix(in srgb, var(--error) 14%, transparent);
}

.quick-fix-panel__reason {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
}

.quick-fix-panel__meta {
  margin: 0;
  font-size: 11px;
  color: var(--ink-3);
}
</style>
