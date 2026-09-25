<template>
  <div class="file-feedback" @click.stop>
    <span v-if="status === 'submitted'" class="file-feedback__done">
      {{ t(`codegenFeedback.done.${verdict}`) }}
    </span>
    <template v-else>
      <div class="file-feedback__buttons">
        <button
          v-for="option in VERDICTS"
          :key="option"
          type="button"
          class="file-feedback__btn"
          :class="[`file-feedback__btn--${option}`, { active: verdict === option }]"
          :disabled="status === 'submitting' || !hasWorkspace"
          :data-verdict="option"
          @click="choose(option)"
        >
          {{ t(`codegenFeedback.verdict.${option}`) }}
        </button>
      </div>
      <span v-if="!hasWorkspace" class="file-feedback__diff-note">
        {{ t("codegenFeedback.noWorkspace") }}
      </span>
      <div
        v-if="verdict && verdict !== 'accept' && status !== 'idle'"
        class="file-feedback__composer"
      >
        <textarea
          v-model="reason"
          class="file-feedback__reason"
          :placeholder="t(`codegenFeedback.reasonPlaceholder.${verdict}`)"
          :disabled="status === 'submitting'"
        />
        <span
          v-if="verdict === 'edit' && userEditDiff"
          class="file-feedback__diff-note"
        >
          {{ t("codegenFeedback.diffAttached") }}
        </span>
        <div class="file-feedback__composer-actions">
          <button
            type="button"
            class="file-feedback__submit"
            :disabled="status === 'submitting'"
            @click="submitComposed"
          >
            {{ status === "submitting" ? "…" : t("codegenFeedback.submit") }}
          </button>
          <button
            type="button"
            class="file-feedback__cancel"
            :disabled="status === 'submitting'"
            @click="cancel"
          >
            {{ t("codegenFeedback.cancel") }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from "vue";
import type { CodegenFeedbackVerdict } from "@/shared/api/endpoints/codegen-feedback";
import { useInjectedAppSettings } from "@/entities/app-settings/contract";
import { useI18n } from "@/shared/lib/i18n";
import { useFileFeedback } from "./useFileFeedback";

const VERDICTS: readonly CodegenFeedbackVerdict[] = ["accept", "reject", "edit"];

const props = defineProps<{
  taskId?: string;
  filePath: string;
  userEditDiff?: string;
}>();

const { t } = useI18n();
const settings = useInjectedAppSettings();

const { status, verdict, reason, hasWorkspace, choose, submitComposed, cancel } =
  useFileFeedback({
    taskId: toRef(props, "taskId"),
    filePath: toRef(props, "filePath"),
    userEditDiff: toRef(props, "userEditDiff"),
    workspaceRoot: computed(() => settings.form.workspace_root ?? ""),
    memoryNamespace: computed(() => settings.form.swarm_memory_namespace),
  });
</script>

<style scoped>
.file-feedback {
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: default;
  font-family: inherit;
}
.file-feedback__buttons {
  display: flex;
  gap: 4px;
}
.file-feedback__btn {
  background: none;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #9dadd0);
  cursor: pointer;
  font-size: 10px;
  padding: 2px 7px;
}
.file-feedback__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.file-feedback__btn--accept.active,
.file-feedback__btn--accept:hover:not(:disabled) {
  border-color: var(--success, #51cf66);
  color: var(--success, #51cf66);
}
.file-feedback__btn--reject.active,
.file-feedback__btn--reject:hover:not(:disabled) {
  border-color: var(--error, #f03e3e);
  color: var(--error, #f03e3e);
}
.file-feedback__btn--edit.active,
.file-feedback__btn--edit:hover:not(:disabled) {
  border-color: var(--accent, #3b5bdb);
  color: var(--text1, #c8cfe8);
}
.file-feedback__composer {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.file-feedback__reason {
  min-height: 56px;
  box-sizing: border-box;
  width: 100%;
  background: var(--bg2, #1e2230);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text1, #c8cfe8);
  font-family: inherit;
  font-size: 12px;
  padding: 4px 6px;
  resize: vertical;
}
.file-feedback__diff-note {
  font-size: 10px;
  color: var(--text3, #6b7a99);
}
.file-feedback__composer-actions {
  display: flex;
  gap: 6px;
}
.file-feedback__submit {
  padding: 3px 12px;
  background: var(--accent, #3b5bdb);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}
.file-feedback__submit:disabled,
.file-feedback__cancel:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.file-feedback__cancel {
  padding: 3px 10px;
  background: none;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #9dadd0);
  cursor: pointer;
  font-size: 11px;
}
.file-feedback__done {
  font-size: 10px;
  color: var(--success, #51cf66);
}
</style>
