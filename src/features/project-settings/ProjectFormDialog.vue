<template>
  <Teleport to="body">
    <Transition name="project-form__overlay">
      <div
        v-if="open"
        class="project-form__backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @mousedown.self="onCancel"
      >
        <div class="project-form__dialog" @mousedown.stop>
          <header class="project-form__header">
            <h2 class="project-form__title">{{ title }}</h2>
            <CloseIconButton
              :label="t('dialogs.cancel')"
              :size="14"
              :stroke-width="2.2"
              extra-class="project-form__close"
              @click="onCancel"
            />
          </header>

          <form class="project-form__body" @submit.prevent="onSave">
            <ProjectFormBasicSection
              :form="form"
              :capabilities="props.capabilities"
              :caps-warn="capsWarn"
              @update:field="onFieldChange"
              @cancel="onCancel"
              @name-input-ref="(el) => (nameEl = el)"
            />

            <ProjectFormAdvancedSections
              :form="form"
              :mcp-slice="mcpSlice"
              :db-slice="dbSlice"
              :visual-slice="visualSlice"
              @update:field="onFieldChange"
              @update:child-field="onFieldUpdate"
            />

            <footer class="project-form__actions">
              <button type="button" class="btn-secondary" @click="onCancel">
                {{ t("dialogs.cancel") }}
              </button>
              <button type="submit" class="btn-primary" :disabled="!form.name.trim()">
                {{
                  mode === "create" ? t("projectForm.create") : t("projectForm.save")
                }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, toRef } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import ProjectFormBasicSection from "./ProjectFormBasicSection.vue";
import ProjectFormAdvancedSections from "./ProjectFormAdvancedSections.vue";
import CloseIconButton from "@/shared/components/CloseIconButton.vue";
import { useProjectFormState, type ProjectFormValues } from "./useProjectFormState";
// Shared layout primitives — see project-form-shared.css for rationale.
import "./project-form-shared.css";

const props = defineProps<{
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<ProjectFormValues>;
  capabilities: { workspace_write?: boolean; command_exec?: boolean } | null;
}>();

const emit = defineEmits<{
  "update:open": [val: boolean];
  submit: [values: ProjectFormValues];
}>();

const { t } = useI18n();

const {
  form,
  nameEl,
  capsWarn,
  mcpSlice,
  dbSlice,
  visualSlice,
  onFieldUpdate,
  buildSubmitPayload,
} = useProjectFormState({
  open: toRef(props, "open"),
  initial: toRef(props, "initial"),
  capabilities: toRef(props, "capabilities"),
});

const title = computed(() =>
  props.mode === "create" ? t("projectForm.titleCreate") : t("projectForm.titleEdit"),
);

function onFieldChange(field: keyof ProjectFormValues, value: string | boolean): void {
  (form as Record<string, unknown>)[field] = value;
}

function onCancel(): void {
  emit("update:open", false);
}

function onSave(): void {
  const payload = buildSubmitPayload();
  if (!payload) return;
  emit("submit", payload);
}
</script>

<style scoped>
.project-form__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 8, 6, 0.54);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 400;
}

.project-form__dialog {
  width: min(560px, 100%);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.project-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
}
.project-form__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.project-form__close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text3);
  padding: 4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s,
    color 0.15s;
}
.project-form__close:hover {
  background: var(--surface2);
  color: var(--text);
}

.project-form__body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
  position: sticky;
  bottom: 0;
  background: var(--surface);
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.project-form__overlay-enter-active,
.project-form__overlay-leave-active {
  transition: opacity 0.16s var(--ease-spring);
}
.project-form__overlay-enter-active .project-form__dialog,
.project-form__overlay-leave-active .project-form__dialog {
  transition:
    transform 0.18s var(--ease-spring),
    opacity 0.18s var(--ease-spring);
}
.project-form__overlay-enter-from,
.project-form__overlay-leave-to {
  opacity: 0;
}
.project-form__overlay-enter-from .project-form__dialog,
.project-form__overlay-leave-to .project-form__dialog {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
