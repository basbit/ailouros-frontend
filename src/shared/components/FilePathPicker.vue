<template>
  <div class="file-path-picker">
    <input
      class="file-path-picker__input"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete ?? 'off'"
      :spellcheck="false"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      class="file-path-picker__browse"
      :title="browseLabel"
      :aria-label="browseLabel"
      :disabled="pickerOpen"
      @click="onBrowseClick"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        />
      </svg>
    </button>
    <input
      v-if="!isDesktopShell"
      ref="browserInputRef"
      type="file"
      class="file-path-picker__hidden-input"
      :accept="acceptAttribute"
      :webkitdirectory="directory ? true : undefined"
      @change="onBrowserFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  autocomplete?: string;
  directory?: boolean;
  fileExtensions?: string[];
  pickerTitle?: string;
  defaultPath?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { t } = useI18n();
const isDesktopShell = isDesktop();
const pickerOpen = ref(false);
const browserInputRef = ref<HTMLInputElement | null>(null);

const browseLabel = computed(
  () =>
    props.pickerTitle ??
    t(props.directory ? "filePicker.pickDirectory" : "filePicker.pickFile"),
);

const acceptAttribute = computed(() => {
  if (props.directory || !props.fileExtensions?.length) return undefined;
  return props.fileExtensions.map((ext) => "." + ext.replace(/^\./, "")).join(",");
});

function onInput(value: string): void {
  emit("update:modelValue", value);
}

function onBrowseClick(): void {
  if (isDesktopShell) {
    void openDesktopPicker();
    return;
  }
  browserInputRef.value?.click();
}

async function openDesktopPicker(): Promise<void> {
  if (pickerOpen.value) return;
  pickerOpen.value = true;
  try {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const filters =
      props.directory || !props.fileExtensions?.length
        ? undefined
        : [{ name: t("filePicker.filterLabel"), extensions: props.fileExtensions }];
    const selected = await dialog.open({
      directory: !!props.directory,
      multiple: false,
      title: browseLabel.value,
      defaultPath: props.defaultPath || props.modelValue || undefined,
      filters,
    });
    if (typeof selected === "string" && selected) {
      emit("update:modelValue", selected);
    }
  } catch (error) {
    frontendLogger.warn("file picker failed", error);
  } finally {
    pickerOpen.value = false;
  }
}

function onBrowserFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  const fallbackPath = relative && relative.length ? relative : file.name;
  emit("update:modelValue", fallbackPath);
  input.value = "";
}
</script>

<style scoped>
.file-path-picker {
  display: flex;
  gap: 6px;
  align-items: stretch;
  width: 100%;
  min-width: 0;
}
.file-path-picker__input {
  flex: 1;
  min-width: 0;
}
.file-path-picker__browse {
  background: var(--surface2, #1e2230);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #9dadd0);
  padding: 0 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.file-path-picker__browse:hover:not(:disabled) {
  color: var(--text, #f5f0e7);
  background: var(--surface3, #2a2f3e);
}
.file-path-picker__browse:disabled {
  opacity: 0.6;
  cursor: progress;
}
.file-path-picker__hidden-input {
  display: none;
}
</style>
