<template>
  <div ref="wrapRef" class="prompt-input-wrap">
    <textarea
      ref="taRef"
      :rows="rows"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeydown"
    />
    <div v-if="mentionActive" class="mention-dropdown" :style="dropdownStyle">
      <div v-if="loading" class="mention-state">{{ t("prompt.mention.loading") }}</div>
      <div v-else-if="loadError" class="mention-state mention-state--error">
        {{ t("prompt.mention.error") }}
      </div>
      <div v-else-if="!filteredFiles.length" class="mention-state">
        {{ t("prompt.mention.empty") }}
      </div>
      <div
        v-for="(f, idx) in filteredFiles"
        :key="f"
        class="mention-item"
        :class="{ active: idx === selectedIdx }"
        @mousedown.prevent="insertMention(f)"
      >
        {{ f }}
      </div>
      <div v-if="filteredFiles.length" class="mention-state mention-state--hint">
        {{ t("prompt.mention.hint") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { listWorkspaceFiles } from "@/shared/api/endpoints/workspace";
import { useI18n } from "@/shared/lib/i18n";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    workspaceRoot?: string;
    rows?: number;
    placeholder?: string;
  }>(),
  {
    workspaceRoot: "",
    rows: 5,
    placeholder: "Describe the task… Type @ to attach a file",
  },
);

const emit = defineEmits<{ "update:modelValue": [v: string] }>();
const { t } = useI18n();

const taRef = ref<HTMLTextAreaElement | null>(null);
const wrapRef = ref<HTMLDivElement | null>(null);

const mentionActive = ref(false);
const mentionQuery = ref("");
const mentionTriggerPos = ref(0);
const cursorPos = ref(0);
const fileList = ref<string[]>([]);
const filteredFiles = ref<string[]>([]);
const selectedIdx = ref(0);
const dropdownStyle = ref<Record<string, string>>({});
const loading = ref(false);
const loadError = ref(false);

let _fetchedRoot = "";

async function fetchFiles(): Promise<void> {
  const wr = props.workspaceRoot?.trim() ?? "";
  if (!wr || wr === _fetchedRoot) return;
  _fetchedRoot = wr;
  loading.value = true;
  loadError.value = false;
  try {
    const data = await listWorkspaceFiles(wr);
    fileList.value = Array.isArray(data.files) ? data.files : [];
  } catch {
    fileList.value = [];
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.workspaceRoot,
  () => {
    _fetchedRoot = "";
  },
);

function onInput(e: Event): void {
  const ta = e.target as HTMLTextAreaElement;
  emit("update:modelValue", ta.value);
  const cursor = ta.selectionStart ?? 0;
  cursorPos.value = cursor;
  const before = ta.value.slice(0, cursor);
  const m = /[@/]([^\s@/]*)$/.exec(before);
  if (m) {
    mentionTriggerPos.value = cursor - m[0].length;
    mentionQuery.value = m[1];
    mentionActive.value = true;
    selectedIdx.value = 0;
    filterFiles();
    void fetchFiles().then(() => filterFiles());
    positionDropdown();
  } else {
    mentionActive.value = false;
  }
}

function filterFiles(): void {
  const q = mentionQuery.value.toLowerCase();
  filteredFiles.value = q
    ? fileList.value.filter((f) => f.toLowerCase().includes(q)).slice(0, 20)
    : fileList.value.slice(0, 20);
}

function positionDropdown(): void {
  nextTick(() => {
    const ta = taRef.value;
    if (!ta) return;
    dropdownStyle.value = {
      top: `${ta.offsetTop + Math.min(ta.offsetHeight - 8, caretTop(ta) + 28)}px`,
      left: `${ta.offsetLeft + 8}px`,
      width: `${ta.offsetWidth}px`,
    };
  });
}

function caretTop(ta: HTMLTextAreaElement): number {
  const cursor = ta.selectionStart ?? 0;
  const valueBeforeCursor = ta.value.slice(0, cursor);
  const lineCount = valueBeforeCursor.split("\n").length;
  const lineHeight = Number.parseFloat(getComputedStyle(ta).lineHeight || "20") || 20;
  return Math.max(0, (lineCount - 1) * lineHeight - ta.scrollTop);
}

function insertMention(filePath: string): void {
  const val = props.modelValue;
  const before = val.slice(0, mentionTriggerPos.value);
  const after = val.slice(cursorPos.value);
  const inserted = `@${filePath}`;
  emit("update:modelValue", before + inserted + after);
  mentionActive.value = false;
  nextTick(() => {
    const ta = taRef.value;
    if (ta) {
      const pos = mentionTriggerPos.value + inserted.length;
      ta.setSelectionRange(pos, pos);
      ta.focus();
    }
  });
}

function onKeydown(e: KeyboardEvent): void {
  if (!mentionActive.value) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selectedIdx.value = Math.min(selectedIdx.value + 1, filteredFiles.value.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    selectedIdx.value = Math.max(selectedIdx.value - 1, 0);
  } else if (e.key === "Enter" || e.key === "Tab") {
    if (filteredFiles.value[selectedIdx.value]) {
      e.preventDefault();
      insertMention(filteredFiles.value[selectedIdx.value]);
    }
  } else if (e.key === "Escape") {
    mentionActive.value = false;
  }
}
</script>

<style scoped>
.prompt-input-wrap {
  position: relative;
}
.prompt-input-wrap textarea {
  width: 100%;
  box-sizing: border-box;
}
.mention-dropdown {
  position: absolute;
  z-index: 1000;
  background: var(--bg2, #1e2230);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.mention-item {
  padding: 5px 10px;
  font-size: 12px;
  font-family: var(--mono, ui-monospace, monospace);
  color: var(--text2, #a8b0c4);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mention-item.active,
.mention-item:hover {
  background: var(--accent, #3b5bdb);
  color: #fff;
}
.mention-state {
  padding: 8px 10px;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.mention-state--error {
  color: var(--error, #f45b5b);
}
.mention-state--hint {
  border-top: 1px solid var(--border, #2a2f3e);
  color: var(--text3, #6b7db5);
}
</style>
