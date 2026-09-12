<template>
  <div v-if="status?.is_active" class="worktree-badge">
    <button
      type="button"
      class="worktree-badge__trigger"
      :class="{
        'worktree-badge__trigger--dirty': status.has_changes,
        'worktree-badge__trigger--clean': !status.has_changes,
      }"
      :title="t('worktree.active')"
      :aria-expanded="isDetailsOpen"
      @click="toggleDetails"
    >
      <span class="worktree-badge__icon">🌿</span>
      <span class="worktree-badge__label">
        {{
          status.has_changes
            ? t("worktree.changes", { count: status.changed_files.length })
            : t("worktree.clean")
        }}
      </span>
      <span class="worktree-badge__arrow">{{ isDetailsOpen ? "▲" : "▼" }}</span>
    </button>

    <div v-if="isDetailsOpen" class="worktree-badge__popover">
      <div class="worktree-badge__popover-header">
        <span class="worktree-badge__popover-title">{{ t("worktree.badge") }}</span>
        <span class="worktree-badge__branch">{{ status.branch_name }}</span>
      </div>

      <div v-if="status.changed_files.length > 0" class="worktree-badge__files">
        <div
          v-for="file in status.changed_files"
          :key="file"
          class="worktree-badge__file-row"
        >
          <span class="worktree-badge__file-icon">📄</span>
          <span class="worktree-badge__file-path">{{ file }}</span>
        </div>
      </div>

      <div class="worktree-badge__actions">
        <button
          type="button"
          class="worktree-badge__btn worktree-badge__btn--apply btn-primary--success"
          :disabled="isBusy || !status.has_changes"
          @click="onApply"
        >
          {{ isBusy ? t("worktree.applying") : t("worktree.apply") }}
        </button>
        <button
          type="button"
          class="worktree-badge__btn worktree-badge__btn--discard btn-primary--danger"
          :disabled="isBusy"
          @click="onDiscard"
        >
          {{ isBusy ? t("worktree.discarding") : t("worktree.discard") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";
import {
  applyWorktree,
  discardWorktree,
  getWorktreeStatus,
} from "@/entities/worktree/api/worktree-api";
import type { ShadowWorktreeStatus } from "@/entities/worktree/model/types";

const props = defineProps<{
  workspaceRoot: string;
  taskId: string;
}>();

const emit = defineEmits<{
  (event: "applied"): void;
  (event: "discarded"): void;
}>();

const { t } = useI18n();
const ux = useUxStore();

const status = ref<ShadowWorktreeStatus | null>(null);
const isDetailsOpen = ref(false);
const isBusy = ref(false);

function toggleDetails(): void {
  isDetailsOpen.value = !isDetailsOpen.value;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function refreshStatus(): Promise<void> {
  try {
    status.value = await getWorktreeStatus(props.workspaceRoot, props.taskId);
  } catch (statusError: unknown) {
    status.value = null;
    ux.notify(
      t("worktree.statusFailed", { error: describeError(statusError) }),
      "error",
    );
  }
}

async function onApply(): Promise<void> {
  if (isBusy.value) return;
  isBusy.value = true;
  try {
    await applyWorktree(props.workspaceRoot, props.taskId);
    isDetailsOpen.value = false;
    await refreshStatus();
    emit("applied");
    ux.notify(t("worktree.applySucceeded"), "success");
  } catch (applyError: unknown) {
    ux.notify(t("worktree.applyFailed", { error: describeError(applyError) }), "error");
  } finally {
    isBusy.value = false;
  }
}

async function onDiscard(): Promise<void> {
  if (isBusy.value) return;
  isBusy.value = true;
  try {
    await discardWorktree(props.workspaceRoot, props.taskId);
    isDetailsOpen.value = false;
    await refreshStatus();
    emit("discarded");
    ux.notify(t("worktree.discardSucceeded"), "success");
  } catch (discardError: unknown) {
    ux.notify(
      t("worktree.discardFailed", { error: describeError(discardError) }),
      "error",
    );
  } finally {
    isBusy.value = false;
  }
}

// The badge lives in the header, which is not remounted when the operator
// switches runs, so without this it would show the previous run's branch while
// Apply/Discard posted the new task id.
watch(
  () => [props.workspaceRoot, props.taskId] as const,
  () => {
    status.value = null;
    isDetailsOpen.value = false;
    void refreshStatus();
  },
);

onMounted(() => {
  void refreshStatus();
});
</script>

<style scoped>
.worktree-badge {
  position: relative;
  display: inline-block;
  font-size: 12px;
}

.worktree-badge__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--line);
  background: var(--card-soft);
  color: var(--ink);
  transition: all 0.2s ease;
}

.worktree-badge__trigger--dirty {
  border-color: var(--warn);
  color: var(--warn);
  background: color-mix(in srgb, var(--warn) 12%, transparent);
}

.worktree-badge__trigger--clean {
  border-color: var(--ok);
  color: var(--ok);
  background: color-mix(in srgb, var(--ok) 12%, transparent);
}

.worktree-badge__arrow {
  font-size: 9px;
  opacity: 0.6;
}

.worktree-badge__popover {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 280px;
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-md);
  padding: 8px;
  z-index: 100;
}

.worktree-badge__popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--line);
  font-size: 11px;
  color: var(--ink);
}

.worktree-badge__popover-title {
  font-weight: 600;
}

.worktree-badge__branch {
  font-family: var(--font-mono);
  color: var(--ink-3);
  font-size: 10px;
}

.worktree-badge__files {
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.worktree-badge__file-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--ink-2);
}

.worktree-badge__file-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.worktree-badge__actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

/* Fill colours come from the shared .btn-primary--success / --danger. */
.worktree-badge__btn {
  padding: 4px 10px;
  border-radius: var(--r-sm);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
}

.worktree-badge__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
