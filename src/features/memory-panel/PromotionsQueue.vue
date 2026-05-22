<template>
  <section class="promotions-queue">
    <header class="promotions-queue__header">
      <h3 class="promotions-queue__title">{{ t("memoryPanel.promotions.title") }}</h3>
      <p class="promotions-queue__subtitle">
        {{ t("memoryPanel.promotions.subtitle") }}
      </p>
      <button
        type="button"
        class="promotions-queue__refresh"
        :disabled="loading"
        @click="loadEntries"
      >
        {{ t("memoryPanel.promotions.refresh") }}
      </button>
    </header>

    <p v-if="!workspaceRoot" class="promotions-queue__hint">
      {{ t("memoryPanel.promotions.workspaceMissing") }}
    </p>
    <p v-else-if="loading" class="promotions-queue__hint">
      {{ t("memoryPanel.promotions.loading") }}
    </p>
    <p v-else-if="error" class="promotions-queue__error">
      {{ t("memoryPanel.promotions.error", { error }) }}
    </p>
    <p v-else-if="!entries.length" class="promotions-queue__hint">
      {{ t("memoryPanel.promotions.empty") }}
    </p>

    <ul v-else class="promotions-queue__list">
      <li v-for="entry in entries" :key="entry.id" class="promotions-queue__item">
        <div class="promotions-queue__item-head">
          <span class="promotions-queue__item-key">{{ entry.candidate.key }}</span>
          <span class="promotions-queue__arrow">
            {{ entry.candidate.source_level }} → {{ entry.target_level }}
          </span>
        </div>
        <div class="promotions-queue__meta">
          <span>{{
            t("memoryPanel.promotions.metaUsage", {
              count: entry.candidate.usage_count,
            })
          }}</span>
          <span>{{
            t("memoryPanel.promotions.metaOwners", {
              count: entry.candidate.distinct_owners,
            })
          }}</span>
          <span>{{
            t("memoryPanel.promotions.metaCreated", { at: entry.created_at })
          }}</span>
        </div>
        <p v-if="entry.reason" class="promotions-queue__reason">{{ entry.reason }}</p>
        <div class="promotions-queue__row">
          <input
            v-model="notes[entry.id]"
            type="text"
            class="promotions-queue__note"
            :placeholder="t('memoryPanel.promotions.notePlaceholder')"
          />
          <button
            type="button"
            class="promotions-queue__btn promotions-queue__btn--approve"
            :disabled="busy[entry.id]"
            @click="onApprove(entry)"
          >
            {{ t("memoryPanel.promotions.approve") }}
          </button>
          <button
            type="button"
            class="promotions-queue__btn promotions-queue__btn--revert"
            :disabled="busy[entry.id]"
            @click="onRevert(entry)"
          >
            {{ t("memoryPanel.promotions.revert") }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { ApiError } from "@/shared/api/client";
import {
  approvePromotion,
  listPromotions,
  revertPromotion,
  type PromotionEntry,
} from "@/shared/api/endpoints/memoryPromotions";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";

const props = defineProps<{ workspaceRoot: string }>();

const { t } = useI18n();
const ux = useUxStore();

const entries = ref<PromotionEntry[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const busy = reactive<Record<string, boolean>>({});
const notes = reactive<Record<string, string>>({});

function describeError(e: unknown): string {
  if (e instanceof ApiError) return e.body || `HTTP ${e.status}`;
  if (e instanceof Error) return e.message;
  return String(e);
}

async function loadEntries(): Promise<void> {
  if (!props.workspaceRoot) {
    entries.value = [];
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const data = await listPromotions(props.workspaceRoot, "pending");
    entries.value = data.entries ?? [];
  } catch (e: unknown) {
    error.value = describeError(e);
  } finally {
    loading.value = false;
  }
}

interface ActionMessages {
  confirmTitle: string;
  confirmMessage: string;
  successMessage: string;
}

async function runPromotionAction(
  entry: PromotionEntry,
  call: (id: string, workspaceRoot: string, note: string) => Promise<unknown>,
  messages: ActionMessages,
): Promise<void> {
  const confirmed = await ux.confirmDialog({
    title: messages.confirmTitle,
    message: messages.confirmMessage,
    confirmLabel: t("memoryPanel.promotions.confirmYes"),
    cancelLabel: t("memoryPanel.promotions.confirmNo"),
  });
  if (!confirmed) return;
  busy[entry.id] = true;
  try {
    await call(entry.id, props.workspaceRoot, notes[entry.id] ?? "");
    ux.notify(messages.successMessage, "success");
    entries.value = entries.value.filter((it) => it.id !== entry.id);
    delete notes[entry.id];
  } catch (e: unknown) {
    ux.notify(
      t("memoryPanel.promotions.actionFailed", { error: describeError(e) }),
      "error",
    );
  } finally {
    busy[entry.id] = false;
  }
}

function templateArgs(entry: PromotionEntry) {
  return {
    key: entry.candidate.key,
    source: entry.candidate.source_level,
    target: entry.target_level,
  };
}

async function onApprove(entry: PromotionEntry): Promise<void> {
  await runPromotionAction(entry, approvePromotion, {
    confirmTitle: t("memoryPanel.promotions.confirmApproveTitle"),
    confirmMessage: t(
      "memoryPanel.promotions.confirmApproveMessage",
      templateArgs(entry),
    ),
    successMessage: t("memoryPanel.promotions.approved"),
  });
}

async function onRevert(entry: PromotionEntry): Promise<void> {
  await runPromotionAction(entry, revertPromotion, {
    confirmTitle: t("memoryPanel.promotions.confirmRevertTitle"),
    confirmMessage: t(
      "memoryPanel.promotions.confirmRevertMessage",
      templateArgs(entry),
    ),
    successMessage: t("memoryPanel.promotions.reverted"),
  });
}

watch(
  () => props.workspaceRoot,
  () => {
    void loadEntries();
  },
);

onMounted(() => {
  void loadEntries();
});

defineExpose({ loadEntries });
</script>

<style scoped>
.promotions-queue {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--line, #3a4a5a);
  border-radius: var(--r-md, 8px);
  background: var(--card, #1a232c);
}

.promotions-queue__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
}

.promotions-queue__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink, #ddd);
}

.promotions-queue__subtitle {
  margin: 0;
  font-size: 11px;
  color: var(--ink-2, #aaa);
}

.promotions-queue__refresh {
  position: absolute;
  right: 0;
  top: 0;
  background: transparent;
  border: 1px solid var(--line, #3a4a5a);
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 11px;
  color: var(--ink-2, #aaa);
  cursor: pointer;
}

.promotions-queue__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.promotions-queue__hint {
  margin: 0;
  font-size: 11px;
  color: var(--ink-3, #888);
}

.promotions-queue__error {
  margin: 0;
  font-size: 11px;
  color: #c0392b;
}

.promotions-queue__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.promotions-queue__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border: 1px solid var(--line, #3a4a5a);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.02);
}

.promotions-queue__item-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
}

.promotions-queue__item-key {
  font-weight: 600;
  color: var(--ink, #ddd);
  font-family: var(--font-mono, monospace);
}

.promotions-queue__arrow {
  font-size: 11px;
  color: var(--ink-2, #aaa);
}

.promotions-queue__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 10px;
  color: var(--ink-3, #888);
}

.promotions-queue__reason {
  margin: 0;
  font-size: 11px;
  color: var(--ink-2, #aaa);
  font-style: italic;
}

.promotions-queue__row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 4px;
}

.promotions-queue__note {
  flex: 1;
  appearance: none;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--line, #3a4a5a);
  background: var(--card, #1a232c);
  color: var(--ink, #ddd);
  font-size: 11px;
}

.promotions-queue__btn {
  appearance: none;
  border: 1px solid var(--line, #3a4a5a);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  background: var(--card, #1a232c);
  color: var(--ink, #ddd);
}

.promotions-queue__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.promotions-queue__btn--approve {
  border-color: #2f8f49;
  color: #4fbf6f;
}

.promotions-queue__btn--revert {
  border-color: #8f3535;
  color: #df6060;
}
</style>
