<template>
  <div v-if="visible" class="asset-upload" @click.self="emit('close')">
    <div class="asset-upload__panel" role="dialog">
      <header class="asset-upload__head">
        <span class="asset-upload__title">{{ t("assetUpload.title") }}</span>
        <button type="button" class="asset-upload__close" @click="emit('close')">
          ×
        </button>
      </header>
      <label
        class="asset-upload__drop"
        @dragover.prevent
        @drop.prevent="onDrop($event)"
        @click="onPickClick"
      >
        <input
          ref="inputRef"
          type="file"
          class="asset-upload__input"
          @change="onFileChange($event)"
        />
        <span v-if="!fileName">{{ t("assetUpload.dropHere") }}</span>
        <span v-else class="asset-upload__file">{{ fileName }}</span>
      </label>
      <div v-if="status === 'uploading'" class="asset-upload__status">
        {{ t("assetUpload.uploading") }}
      </div>
      <div v-else-if="status === 'done' && lastRelativePath" class="asset-upload__done">
        {{ t("assetUpload.uploaded") }} — <code>{{ lastRelativePath }}</code>
      </div>
      <div v-else-if="status === 'error'" class="asset-upload__error">
        {{ t("assetUpload.error", { error: errorMessage }) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  visible: boolean;
  workspaceRoot: string;
  targetSubdir: string;
}>();

const emit = defineEmits<{
  uploaded: [relativePath: string];
  close: [];
}>();

const { t } = useI18n();
const inputRef = ref<HTMLInputElement | null>(null);
const fileName = ref("");
const status = ref<"idle" | "uploading" | "done" | "error">("idle");
const errorMessage = ref("");
const lastRelativePath = ref("");

function onPickClick(event: MouseEvent): void {
  if ((event.target as HTMLElement).tagName === "INPUT") return;
  inputRef.value?.click();
}

async function onFileChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) return;
  await sendFile(file);
}

async function onDrop(event: DragEvent): Promise<void> {
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  await sendFile(file);
}

async function sendFile(file: File): Promise<void> {
  fileName.value = file.name;
  status.value = "uploading";
  errorMessage.value = "";
  const form = new FormData();
  form.append("workspace_root", props.workspaceRoot);
  form.append("target_subdir", props.targetSubdir || "assets");
  form.append("upload", file);
  try {
    const response = await fetch(apiUrl("/v1/assets/upload"), {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      const detail = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(detail.detail ?? `HTTP ${response.status}`);
    }
    const data = await response.json();
    lastRelativePath.value = String(data.relative_path ?? "");
    status.value = "done";
    emit("uploaded", lastRelativePath.value);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : String(err);
    status.value = "error";
  }
}
</script>

<style scoped>
.asset-upload {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.asset-upload__panel {
  background: var(--surface, #1a1d29);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  width: min(440px, 92vw);
  display: flex;
  flex-direction: column;
}
.asset-upload__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.asset-upload__title {
  font-weight: 700;
  font-size: 13px;
}
.asset-upload__close {
  background: transparent;
  border: none;
  color: var(--text2, #a8b0c4);
  font-size: 18px;
  cursor: pointer;
}
.asset-upload__drop {
  margin: 14px;
  padding: 24px 12px;
  border: 1.5px dashed var(--border, #2a2f3e);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
  position: relative;
}
.asset-upload__drop:hover {
  border-color: var(--accent, #3b5bdb);
}
.asset-upload__file {
  font-family: var(--mono, ui-monospace, monospace);
  color: var(--text, #f5f0e7);
}
.asset-upload__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.asset-upload__status,
.asset-upload__done {
  margin: 0 14px 14px;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.asset-upload__error {
  margin: 0 14px 14px;
  font-size: 12px;
  color: var(--error, #d7563f);
}
</style>
