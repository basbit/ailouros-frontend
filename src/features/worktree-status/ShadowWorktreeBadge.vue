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
          class="worktree-badge__btn worktree-badge__btn--apply"
          :disabled="isBusy || !status.has_changes"
          @click="onApply"
        >
          {{ isBusy ? t("worktree.applying") : t("worktree.apply") }}
        </button>
        <button
          type="button"
          class="worktree-badge__btn worktree-badge__btn--discard"
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
import { onMounted, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
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

const status = ref<ShadowWorktreeStatus | null>(null);
const isDetailsOpen = ref(false);
const isBusy = ref(false);

function toggleDetails(): void {
  isDetailsOpen.value = !isDetailsOpen.value;
}

async function refreshStatus(): Promise<void> {
  if (!props.workspaceRoot || !props.taskId) return;
  try {
    status.value = await getWorktreeStatus(props.workspaceRoot, props.taskId);
  } catch {
    status.value = null;
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
  } finally {
    isBusy.value = false;
  }
}

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
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-surface, #ffffff);
  color: var(--text-primary, #0f172a);
  transition: all 0.2s ease;
}

.worktree-badge__trigger--dirty {
  border-color: #f59e0b;
  color: #b45309;
  background: #fffbeb;
}

.worktree-badge__trigger--clean {
  border-color: #10b981;
  color: #047857;
  background: #ecfdf5;
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
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  z-index: 100;
}

.worktree-badge__popover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  font-size: 11px;
}

.worktree-badge__popover-title {
  font-weight: 600;
}

.worktree-badge__branch {
  font-family: monospace;
  color: var(--text-muted, #64748b);
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
  font-family: monospace;
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

.worktree-badge__btn {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease;
}

.worktree-badge__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.worktree-badge__btn--apply {
  background: #10b981;
  color: #ffffff;
}

.worktree-badge__btn--apply:hover:not(:disabled) {
  background: #059669;
}

.worktree-badge__btn--discard {
  background: #ef4444;
  color: #ffffff;
}

.worktree-badge__btn--discard:hover:not(:disabled) {
  background: #dc2626;
}
</style>
