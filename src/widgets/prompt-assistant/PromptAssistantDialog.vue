<template>
  <div v-if="open" class="prompt-coach" role="dialog" aria-modal="true">
    <div class="prompt-coach__panel" @click.stop>
      <header class="prompt-coach__head">
        <button
          v-if="state.stage !== 'picker'"
          type="button"
          class="prompt-coach__back"
          @click="coach.back()"
        >
          ← {{ t("promptCoach.back") }}
        </button>
        <h2 class="prompt-coach__title">{{ headerLabel }}</h2>
        <button
          type="button"
          class="prompt-coach__close"
          :aria-label="t('promptCoach.close')"
          @click="onClose"
        >
          ×
        </button>
      </header>

      <p v-if="state.error" class="prompt-coach__error">{{ state.error }}</p>

      <section v-if="state.stage === 'picker'" class="prompt-coach__picker">
        <p v-if="catalogError" class="prompt-coach__error">{{ catalogError }}</p>
        <p v-if="loading" class="prompt-coach__loading">
          {{ t("promptCoach.loading") }}
        </p>
        <ul v-else-if="templates.length" class="prompt-coach__list">
          <li
            v-for="template in templates"
            :key="template.id"
            class="prompt-coach__item"
          >
            <button
              type="button"
              class="prompt-coach__pick"
              :disabled="state.busy"
              @click="coach.selectTemplate(template.id)"
            >
              <div class="prompt-coach__pick-title">{{ template.title }}</div>
              <div class="prompt-coach__pick-meta">
                <span>{{ template.pack_id }}</span>
                <span v-if="template.source.version">
                  · {{ template.source.version }}
                </span>
              </div>
              <div class="prompt-coach__pick-desc">{{ template.description }}</div>
            </button>
          </li>
        </ul>
        <p v-else class="prompt-coach__empty">{{ t("promptCoach.empty") }}</p>
      </section>

      <section
        v-else-if="state.stage === 'form' && state.selectedTemplate"
        class="prompt-coach__form"
      >
        <p class="prompt-coach__desc">{{ state.selectedTemplate.description }}</p>
        <div
          v-for="input in state.selectedTemplate.inputs"
          :key="input.name"
          class="prompt-coach__field"
        >
          <label :for="`pc-${input.name}`">
            {{ input.label }}
            <span v-if="input.required" class="prompt-coach__required">*</span>
          </label>
          <textarea
            v-if="input.kind === 'long_text'"
            :id="`pc-${input.name}`"
            :value="state.inputValues[input.name] ?? ''"
            :placeholder="input.placeholder"
            rows="4"
            @input="onTextInput(input.name, $event)"
          />
          <select
            v-else-if="input.kind === 'select'"
            :id="`pc-${input.name}`"
            :value="state.inputValues[input.name] ?? ''"
            @change="onSelectChange(input.name, $event)"
          >
            <option v-for="opt in input.options" :key="opt" :value="opt">
              {{ opt }}
            </option>
          </select>
          <input
            v-else
            :id="`pc-${input.name}`"
            type="text"
            :value="state.inputValues[input.name] ?? ''"
            :placeholder="input.placeholder"
            @input="onTextInput(input.name, $event)"
          />
        </div>
        <div class="prompt-coach__footer">
          <button
            type="button"
            class="prompt-coach__primary"
            :disabled="!canRender || state.busy"
            @click="coach.render()"
          >
            {{ state.busy ? t("promptCoach.rendering") : t("promptCoach.preview") }}
          </button>
        </div>
      </section>

      <section
        v-else-if="state.stage === 'preview' && state.rendered"
        class="prompt-coach__preview"
      >
        <textarea
          ref="previewRef"
          class="prompt-coach__preview-text"
          :value="state.rendered.body"
          rows="14"
          @input="onPreviewEdit"
        />
        <div class="prompt-coach__footer">
          <button type="button" class="prompt-coach__primary" @click="onApply">
            {{ t("promptCoach.useThis") }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { usePromptCoach } from "@/features/prompt-coach/usePromptCoach";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  close: [];
  apply: [body: string];
}>();

const { t } = useI18n();
const coach = usePromptCoach();
const { state, templates, loading, catalogError, canRender } = coach;
const previewRef = ref<HTMLTextAreaElement | null>(null);

const headerLabel = computed<string>(() => {
  if (state.stage === "preview") return t("promptCoach.previewTitle");
  if (state.stage === "form") return state.selectedTemplate?.title ?? "";
  return t("promptCoach.pickerTitle");
});

watch(
  () => props.open,
  (value) => {
    if (value) coach.open();
  },
);

function onTextInput(name: string, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  coach.setInput(name, target.value);
}

function onSelectChange(name: string, event: Event): void {
  const target = event.target as HTMLSelectElement;
  coach.setInput(name, target.value);
}

function onPreviewEdit(event: Event): void {
  if (!state.rendered) return;
  const target = event.target as HTMLTextAreaElement;
  state.rendered = { ...state.rendered, body: target.value };
}

function onApply(): void {
  if (!state.rendered) return;
  emit("apply", state.rendered.body);
  coach.reset();
  emit("close");
}

function onClose(): void {
  coach.reset();
  emit("close");
}
</script>

<style scoped>
.prompt-coach {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.prompt-coach__panel {
  background: var(--surface, #11141a);
  color: var(--text, #f5f0e7);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  width: min(720px, 92vw);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.prompt-coach__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.prompt-coach__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
}
.prompt-coach__back,
.prompt-coach__close {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  color: var(--text, #f5f0e7);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}
.prompt-coach__list {
  list-style: none;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
}
.prompt-coach__item {
  margin-bottom: 6px;
}
.prompt-coach__pick {
  width: 100%;
  text-align: left;
  background: var(--surface2, #14171f);
  border: 1px solid var(--border, #2a2f3e);
  color: inherit;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
}
.prompt-coach__pick:hover:not(:disabled) {
  border-color: var(--accent, #3b5bdb);
}
.prompt-coach__pick-title {
  font-weight: 600;
  font-size: 13px;
}
.prompt-coach__pick-meta {
  font-size: 10px;
  color: var(--text2, #a8b0c4);
  margin-top: 2px;
}
.prompt-coach__pick-desc {
  font-size: 12px;
  margin-top: 6px;
  color: var(--text2, #a8b0c4);
}
.prompt-coach__form,
.prompt-coach__preview {
  padding: 12px 14px;
  overflow-y: auto;
}
.prompt-coach__desc {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.prompt-coach__field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
.prompt-coach__field label {
  font-size: 12px;
  margin-bottom: 4px;
}
.prompt-coach__field input,
.prompt-coach__field textarea,
.prompt-coach__field select,
.prompt-coach__preview-text {
  background: var(--surface2, #14171f);
  border: 1px solid var(--border, #2a2f3e);
  color: var(--text, #f5f0e7);
  border-radius: 6px;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 12px;
  resize: vertical;
}
.prompt-coach__required {
  color: var(--error, #d7563f);
  margin-left: 2px;
}
.prompt-coach__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 0 0;
  border-top: 1px solid var(--border, #2a2f3e);
}
.prompt-coach__primary {
  background: var(--accent, #3b5bdb);
  border: none;
  color: white;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 12px;
  cursor: pointer;
}
.prompt-coach__primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.prompt-coach__error,
.prompt-coach__empty,
.prompt-coach__loading {
  margin: 8px 14px;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.prompt-coach__error {
  color: var(--error, #d7563f);
}
.prompt-coach__preview-text {
  width: 100%;
  min-height: 240px;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
}
</style>
