<template>
  <div ref="wrapRef" class="prompt-input-wrap">
    <textarea
      ref="taRef"
      :rows="rows"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeydown"
      @paste="onPaste"
    />
    <button
      v-if="voice.supported.value"
      type="button"
      class="prompt-input-mic"
      :class="{
        'prompt-input-mic--active': voice.active.value,
        'prompt-input-mic--busy': voice.transcribing.value,
      }"
      :disabled="voice.transcribing.value"
      :title="
        voice.transcribing.value
          ? t('prompt.voice.transcribing')
          : voice.active.value
            ? t('prompt.voice.stop')
            : voice.error.value
              ? voice.error.value
              : t('prompt.voice.start')
      "
      @click="onToggleVoice"
    >
      <span aria-hidden="true">{{
        voice.transcribing.value ? "…" : voice.active.value ? "■" : "🎙"
      }}</span>
    </button>
    <button
      type="button"
      class="prompt-input-attach"
      :class="{ 'prompt-input-attach--busy': imageBusy }"
      :title="t('prompt.attach.title')"
      @click="onAttachClick"
    >
      📎
    </button>
    <input
      ref="fileInputRef"
      type="file"
      class="prompt-input-file"
      multiple
      accept="*/*"
      @change="onFilesPicked"
    />
    <p v-if="attachmentNotice" class="attachment-notice" role="alert">
      {{ attachmentNotice }}
    </p>
    <div
      v-if="props.attachments.length || props.imageAttachments.length"
      class="attachments-list"
    >
      <span
        v-for="att in props.attachments"
        :key="`t:${att.name}`"
        class="attachment-chip"
      >
        {{ att.name }}
        <button
          type="button"
          class="attachment-chip__remove"
          :aria-label="t('prompt.attach.remove')"
          @click="onRemoveAttachment(att.name)"
        >
          &times;
        </button>
      </span>
      <span
        v-for="img in props.imageAttachments"
        :key="`i:${img.path}`"
        class="attachment-chip attachment-chip--image"
      >
        🖼 {{ img.name }}
        <button
          type="button"
          class="attachment-chip__remove"
          :aria-label="t('prompt.attach.image.remove')"
          @click="onRemoveImageAttachment(img.path)"
        >
          &times;
        </button>
      </span>
    </div>
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
import type { ImageAttachment, TextAttachment } from "@/shared/model/project-types";
import { readAttachments } from "./attachment-reader";
import { looksLikeImage, uploadImageFiles } from "./image-uploader";
import { useVoiceDictation } from "./useVoiceDictation";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    workspaceRoot?: string;
    rows?: number;
    placeholder?: string;
    attachments?: TextAttachment[];
    imageAttachments?: ImageAttachment[];
  }>(),
  {
    workspaceRoot: "",
    rows: 5,
    placeholder: "Describe the task… Type @ to attach a file",
    attachments: () => [],
    imageAttachments: () => [],
  },
);

const emit = defineEmits<{
  "update:modelValue": [v: string];
  "update:attachments": [v: TextAttachment[]];
  "update:imageAttachments": [v: ImageAttachment[]];
}>();
const { t } = useI18n();

const taRef = ref<HTMLTextAreaElement | null>(null);
const wrapRef = ref<HTMLDivElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

async function onFilesPicked(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  await addFiles(files);
}

async function addFiles(files: File[]): Promise<void> {
  if (!files.length) return;
  // Images cannot ride the inline text path (binary → mojibake); they go to
  // the workspace uploader so pm_vision can pick the stored path up later.
  const images = files.filter(looksLikeImage);
  const texts = files.filter((f) => !looksLikeImage(f));
  if (images.length) {
    await addImageFiles(images);
  }
  if (!texts.length) return;
  const { accepted, rejected } = await readAttachments(texts, props.attachments);
  // A refused file must say so. Dropping it quietly leaves the user believing
  // the model received something it never got.
  attachmentNotice.value = rejected.length
    ? rejected
        .map((entry) =>
          t(`prompt.attach.rejected.${entry.reason}`, { name: entry.name }),
        )
        .join(" ")
    : "";
  if (accepted.length) {
    emit("update:attachments", [...props.attachments, ...accepted]);
  }
}

function onAttachClick(): void {
  fileInputRef.value?.click();
}

function onRemoveAttachment(name: string): void {
  const next = props.attachments.filter((att) => att.name !== name);
  emit("update:attachments", next);
}

function onRemoveImageAttachment(path: string): void {
  emit(
    "update:imageAttachments",
    props.imageAttachments.filter((att) => att.path !== path),
  );
}

const attachmentNotice = ref("");
const imageBusy = ref(false);

async function addImageFiles(files: File[]): Promise<void> {
  const root = props.workspaceRoot.trim();
  if (!root) {
    attachmentNotice.value = t("prompt.attach.image.noWorkspace", {
      name: files.map((f) => f.name).join(", "),
    });
    return;
  }
  imageBusy.value = true;
  attachmentNotice.value = "";
  try {
    // Dedupe against a timestamped name so two pastes of the same "image.png"
    // never overwrite each other on disk (the endpoint writes bytes as-is).
    const outcome = await uploadImageFiles(files, {
      workspaceRoot: root,
      targetSubdir: "assets",
      takenNames: new Set(
        props.imageAttachments.map((att) => att.name.split("/").pop() ?? att.name),
      ),
    });
    if (outcome.accepted.length) {
      emit("update:imageAttachments", [...props.imageAttachments, ...outcome.accepted]);
    }
    attachmentNotice.value = outcome.failed.length
      ? outcome.failed
          .map((entry) =>
            t("prompt.attach.image.failed", { name: entry.name, reason: entry.reason }),
          )
          .join(" ")
      : "";
  } finally {
    imageBusy.value = false;
  }
}

async function onPaste(event: ClipboardEvent): Promise<void> {
  // clipboardData.files covers most apps; screenshot tools that only expose
  // items are picked up by the same filter below via the files list on
  // browsers that surface them there. A plain text paste stays untouched.
  const files = Array.from(event.clipboardData?.files ?? []);
  const images = files.filter(looksLikeImage);
  if (!images.length) return;
  event.preventDefault();
  await addImageFiles(images);
}

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

const voice = useVoiceDictation({
  onTranscript(text, isFinal) {
    if (!isFinal) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const current = props.modelValue ?? "";
    const separator =
      current && !current.endsWith(" ") && !current.endsWith("\n") ? " " : "";
    emit("update:modelValue", current + separator + trimmed);
  },
});

function onToggleVoice(): void {
  if (!voice.supported.value) return;
  if (voice.active.value) {
    void voice.stop();
  } else {
    const lang = (
      typeof document !== "undefined"
        ? (document.documentElement.getAttribute("lang") ?? "")
        : ""
    ).trim();
    void voice.start(lang || undefined);
  }
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
  padding-right: 32px;
}
.prompt-input-mic {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #a8b0c4);
  cursor: pointer;
  z-index: 2;
}
.prompt-input-mic:hover {
  color: var(--text, #f5f0e7);
  border-color: var(--accent, #3b5bdb);
}
.prompt-input-mic--active {
  color: #fff;
  background: color-mix(in srgb, #d7563f 70%, transparent);
  border-color: #d7563f;
  animation: prompt-input-mic-pulse 1.2s ease-in-out infinite;
}
.prompt-input-attach {
  position: absolute;
  top: 4px;
  right: 34px;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #a8b0c4);
  cursor: pointer;
  z-index: 2;
}
.prompt-input-attach:hover {
  color: var(--text, #f5f0e7);
  border-color: var(--accent, #3b5bdb);
}
.prompt-input-attach--busy {
  opacity: 0.6;
  cursor: progress;
}
.prompt-input-file {
  display: none;
}
.attachments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--ink-2, #a8b0c4);
  background: var(--bg-2, #14171f);
  border: 1px solid var(--line, #2a2f3e);
  border-radius: 4px;
}
.attachment-chip--image {
  color: var(--ink, #f5f0e7);
}
.attachment-chip__remove {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--ink-3, #a8b0c4);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0;
}
.attachment-chip__remove:hover {
  color: var(--error, #f45b5b);
}
.attachment-notice {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--error, #f45b5b);
}
@keyframes prompt-input-mic-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(215, 86, 63, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(215, 86, 63, 0);
  }
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
