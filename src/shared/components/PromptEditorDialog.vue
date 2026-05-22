<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="prompt-editor"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="prompt-editor__panel">
        <header class="prompt-editor__head">
          <span class="prompt-editor__title">
            {{ t("promptEditor.title") }}
          </span>
          <button
            type="button"
            class="prompt-editor__close"
            :aria-label="t('promptEditor.close')"
            @click="emit('close')"
          >
            ×
          </button>
        </header>

        <label class="prompt-editor__row">
          <span class="prompt-editor__label">{{ t("promptEditor.pathLabel") }}</span>
          <input
            v-model="pathDraft"
            type="text"
            class="prompt-editor__path-input"
            :placeholder="t('promptEditor.pathPlaceholder')"
            :disabled="saving"
          />
        </label>

        <div v-if="loadError" class="prompt-editor__error">{{ loadError }}</div>
        <div v-if="loading" class="prompt-editor__status">
          {{ t("promptEditor.loading") }}
        </div>

        <textarea
          v-model="bodyDraft"
          class="prompt-editor__body"
          spellcheck="false"
          :placeholder="t('promptEditor.bodyPlaceholder')"
          :disabled="saving"
          @input="onUserEditedBody"
        />

        <footer class="prompt-editor__foot">
          <span v-if="sourceLabel" class="prompt-editor__source">
            {{ t("promptEditor.sourceLabel") }}: {{ sourceLabel }}
          </span>
          <span v-if="saveError" class="prompt-editor__error">{{ saveError }}</span>
          <button
            type="button"
            class="prompt-editor__cancel"
            :disabled="saving"
            @click="emit('close')"
          >
            {{ t("promptEditor.cancel") }}
          </button>
          <button
            type="button"
            class="prompt-editor__save"
            :disabled="!canSave"
            @click="onSave"
          >
            {{ saving ? t("promptEditor.saving") : t("promptEditor.save") }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { ApiError } from "@/shared/api/client";
import { getPromptBody, savePromptOverride } from "@/shared/api/endpoints/catalog";

const props = defineProps<{
  open: boolean;
  initialPath: string;
}>();

const emit = defineEmits<{
  close: [];
  saved: [path: string];
}>();

const { t } = useI18n();

const pathDraft = ref("");
const bodyDraft = ref("");
const sourceLabel = ref<string>("");
const loading = ref(false);
const saving = ref(false);
const userTouched = ref(false);
const loadError = ref<string | null>(null);
const saveError = ref<string | null>(null);

const canSave = computed(() => {
  return !saving.value && pathDraft.value.trim().endsWith(".md");
});

watch(
  () => props.open,
  async (visibleNow) => {
    if (!visibleNow) return;
    pathDraft.value = props.initialPath.trim();
    bodyDraft.value = "";
    sourceLabel.value = "";
    userTouched.value = false;
    loadError.value = null;
    saveError.value = null;
    if (!pathDraft.value) return;
    await loadBody(pathDraft.value);
  },
  { immediate: true },
);

function onUserEditedBody(): void {
  userTouched.value = true;
}

async function loadBody(path: string): Promise<void> {
  loading.value = true;
  try {
    const result = await getPromptBody(path);
    if (!userTouched.value) {
      bodyDraft.value = result.body;
      sourceLabel.value = result.source;
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      sourceLabel.value = "";
      loadError.value = t("promptEditor.notFoundHint");
      return;
    }
    loadError.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

async function onSave(): Promise<void> {
  const path = pathDraft.value.trim();
  if (!path) return;
  saving.value = true;
  saveError.value = null;
  try {
    await savePromptOverride(path, bodyDraft.value);
    sourceLabel.value = "overrides";
    emit("saved", path);
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : String(err);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.prompt-editor {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 56px;
  z-index: 600;
}
.prompt-editor__panel {
  width: min(760px, 94vw);
  max-height: 84vh;
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.prompt-editor__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line-strong);
}
.prompt-editor__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.prompt-editor__close {
  background: transparent;
  border: none;
  color: var(--text2);
  font-size: 18px;
  cursor: pointer;
}
.prompt-editor__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px 0;
}
.prompt-editor__label {
  font-size: 11px;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.prompt-editor__path-input {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text);
}
.prompt-editor__body {
  margin: 8px 14px 0;
  min-height: 360px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: var(--mono, ui-monospace, monospace);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  resize: vertical;
}
.prompt-editor__status,
.prompt-editor__source {
  font-size: 11px;
  color: var(--text2);
  padding: 4px 14px 0;
}
.prompt-editor__error {
  color: var(--error, #f03e3e);
  font-size: 12px;
  padding: 4px 14px 0;
}
.prompt-editor__foot {
  display: flex;
  gap: 8px;
  padding: 10px 14px 12px;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid var(--line-strong);
  margin-top: 10px;
}
.prompt-editor__cancel,
.prompt-editor__save {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.prompt-editor__cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}
.prompt-editor__save {
  background: var(--accent, #3b5bdb);
  border: 1px solid var(--accent, #3b5bdb);
  color: #fff;
}
.prompt-editor__save:disabled,
.prompt-editor__cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
