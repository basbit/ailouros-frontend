<template>
  <div v-if="visible" class="dir-picker" @click.self="emit('close')">
    <div class="dir-picker__panel" role="dialog" aria-modal="true">
      <header class="dir-picker__head">
        <span class="dir-picker__title">{{ title }}</span>
        <button
          type="button"
          class="dir-picker__close"
          :aria-label="t('directoryPicker.close')"
          @click="emit('close')"
        >
          ×
        </button>
      </header>

      <div class="dir-picker__current">
        <button
          type="button"
          class="dir-picker__up"
          :disabled="loading || parent === null"
          @click="loadPath(parent ?? '')"
        >
          {{ t("directoryPicker.up") }}
        </button>
        <code class="dir-picker__path">{{ currentPath || "…" }}</code>
      </div>

      <div v-if="errorMessage" class="dir-picker__error">{{ errorMessage }}</div>

      <ul v-else class="dir-picker__list">
        <li v-if="loading" class="dir-picker__loading">
          {{ t("directoryPicker.loading") }}
        </li>
        <li v-else-if="!entries.length" class="dir-picker__empty">
          {{ t("directoryPicker.empty") }}
        </li>
        <li v-for="entry in entries" v-else :key="entry.path" class="dir-picker__item">
          <button
            type="button"
            class="dir-picker__item-btn"
            @click="loadPath(entry.path)"
          >
            {{ entry.name }}
          </button>
        </li>
      </ul>

      <footer class="dir-picker__foot">
        <button type="button" class="dir-picker__cancel" @click="emit('close')">
          {{ t("directoryPicker.cancel") }}
        </button>
        <button
          type="button"
          class="dir-picker__confirm"
          :disabled="!currentPath"
          @click="onConfirm"
        >
          {{ t("directoryPicker.select") }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { ApiError } from "@/shared/api/http";
import {
  listDirectories,
  type DirectoryEntry,
} from "@/shared/api/endpoints/filesystem";

const props = defineProps<{
  visible: boolean;
  startPath?: string;
  title?: string;
}>();

const emit = defineEmits<{
  select: [path: string];
  close: [];
}>();

const { t } = useI18n();
const currentPath = ref("");
const parent = ref<string | null>(null);
const entries = ref<DirectoryEntry[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const title = computed(() => props.title ?? t("directoryPicker.title"));

async function loadPath(path: string): Promise<void> {
  loading.value = true;
  errorMessage.value = "";
  try {
    const listing = await listDirectories(path);
    currentPath.value = listing.path;
    parent.value = listing.parent;
    entries.value = listing.entries;
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : t("directoryPicker.loadFailed");
  } finally {
    loading.value = false;
  }
}

function onConfirm(): void {
  if (!currentPath.value) return;
  emit("select", currentPath.value);
}

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) void loadPath(props.startPath ?? "");
  },
  { immediate: true },
);
</script>

<style scoped>
.dir-picker {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bg, #000) 70%, transparent);
}
.dir-picker__panel {
  width: min(560px, 92vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--line, #2a2f3e);
  border-radius: var(--r-lg, 12px);
  background: var(--card, #14161d);
  color: var(--ink, #f5f0e7);
}
.dir-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dir-picker__title {
  font-size: 14px;
  font-weight: 600;
}
.dir-picker__close {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink-3, #9dadd0);
  font-size: 18px;
  cursor: pointer;
}
.dir-picker__current {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dir-picker__up {
  appearance: none;
  padding: 4px 10px;
  border-radius: var(--r-sm, 6px);
  border: 1px solid var(--line, #2a2f3e);
  background: var(--bg-2, #1e2230);
  color: var(--ink-2, #cdd6f0);
  font-size: 12px;
  cursor: pointer;
}
.dir-picker__up:disabled {
  opacity: 0.5;
  cursor: default;
}
.dir-picker__path {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--ink-3, #9dadd0);
}
.dir-picker__list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  border: 1px solid var(--line, #2a2f3e);
  border-radius: var(--r-sm, 6px);
}
.dir-picker__item-btn {
  appearance: none;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--ink, #f5f0e7);
  font-size: 13px;
  cursor: pointer;
}
.dir-picker__item-btn:hover {
  background: var(--bg-2, #1e2230);
}
.dir-picker__loading,
.dir-picker__empty {
  padding: 12px;
  font-size: 12px;
  color: var(--ink-4, #6b7694);
}
.dir-picker__error {
  padding: 10px;
  font-size: 12px;
  color: var(--error, #e5484d);
}
.dir-picker__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.dir-picker__cancel,
.dir-picker__confirm {
  appearance: none;
  padding: 7px 16px;
  border-radius: var(--r-md, 8px);
  border: 1px solid var(--line, #2a2f3e);
  font-size: 12px;
  cursor: pointer;
}
.dir-picker__cancel {
  background: transparent;
  color: var(--ink-2, #cdd6f0);
}
.dir-picker__confirm {
  background: var(--accent, #d98b5f);
  border-color: var(--accent, #d98b5f);
  color: #1a1206;
  font-weight: 600;
}
.dir-picker__confirm:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
