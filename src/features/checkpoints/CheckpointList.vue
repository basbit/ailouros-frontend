<template>
  <div class="checkpoint-list">
    <h3 class="checkpoint-list__title">{{ t("checkpoints.title") }}</h3>
    <p v-if="!checkpoints.length" class="checkpoint-list__empty">
      {{ t("checkpoints.empty") }}
    </p>
    <ul v-else class="checkpoint-list__items">
      <li v-for="cp in checkpoints" :key="cp.step_id" class="checkpoint-list__item">
        <div class="checkpoint-list__item-header">
          <span class="checkpoint-list__step-id">{{ cp.step_id }}</span>
          <span class="checkpoint-list__index">#{{ cp.step_index }}</span>
          <span class="checkpoint-list__time">{{ formatTime(cp.timestamp) }}</span>
        </div>
        <button class="checkpoint-list__resume-btn" @click="emit('resume', cp.step_id)">
          {{ t("checkpoints.resume") }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

export interface CheckpointItem {
  step_id: string;
  step_index: number;
  timestamp: number;
  timestamp_utc?: string;
}

defineProps<{
  taskId: string;
  checkpoints: CheckpointItem[];
}>();

const emit = defineEmits<{
  (e: "resume", stepId: string): void;
}>();
const { t } = useI18n();

function formatTime(epoch: number): string {
  if (!epoch) return "";
  return new Date(epoch * 1000).toLocaleTimeString();
}
</script>

<style scoped>
.checkpoint-list {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.checkpoint-list__title {
  margin: 0 0 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.checkpoint-list__empty {
  color: #888;
  font-size: 0.85rem;
  margin: 0;
}

.checkpoint-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkpoint-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ddd;
  gap: 8px;
}

.checkpoint-list__item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.checkpoint-list__step-id {
  font-weight: 500;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checkpoint-list__index {
  color: #888;
  font-size: 0.75rem;
}

.checkpoint-list__time {
  color: #aaa;
  font-size: 0.75rem;
  white-space: nowrap;
}

.checkpoint-list__resume-btn {
  padding: 4px 10px;
  font-size: 0.75rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.checkpoint-list__resume-btn:hover {
  background: #1d4ed8;
}
</style>
