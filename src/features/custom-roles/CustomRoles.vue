<template>
  <div>
    <div v-for="(role, idx) in customRoles" :key="idx" class="custom-role-row">
      <div class="custom-role-grid">
        <div class="field">
          <label class="field-label">{{ t("customRoles.idLabel") }}</label>
          <input
            type="text"
            class="cr-id"
            placeholder="e.g. legal_review"
            autocomplete="off"
            :value="role.id"
            @input="update(idx, 'id', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label class="field-label">{{ t("customRoles.listName") }}</label>
          <input
            type="text"
            class="cr-label"
            placeholder="Legal review"
            autocomplete="off"
            :value="role.label"
            @input="update(idx, 'label', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label class="field-label">{{ t("customRoles.envLabel") }}</label>
          <select
            class="cr-env"
            :value="role.environment"
            @change="
              update(idx, 'environment', ($event.target as HTMLSelectElement).value)
            "
          >
            <option value="ollama">ollama</option>
            <option value="lmstudio">lmstudio</option>
            <option value="cloud">cloud</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">{{ t("customRoles.modelLabel") }}</label>
          <span
            v-if="uiState(idx).modelFetchError"
            class="model-fetch-error"
            :title="uiState(idx).modelFetchError!"
          >
            ⚠ {{ uiState(idx).modelFetchError }}
          </span>
          <select
            v-else-if="uiState(idx).modelChoices.length > 0"
            class="cr-model"
            :value="modelSelValue(idx)"
            @change="onModelChange(idx, ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="[val, lbl] in uiState(idx).modelChoices"
              :key="val"
              :value="val"
            >
              {{ lbl }}
            </option>
            <option value="__custom__">Custom…</option>
          </select>
          <input
            v-else
            type="text"
            class="cr-model"
            placeholder="model id"
            autocomplete="off"
            :value="role.model"
            @input="update(idx, 'model', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div
          v-if="modelSelValue(idx) === '__custom__'"
          class="field"
          style="grid-column: 1/-1"
        >
          <label class="field-label">custom model id</label>
          <input
            type="text"
            class="cr-model-custom"
            placeholder="model id"
            autocomplete="off"
            :value="role.model"
            @input="update(idx, 'model', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field" style="grid-column: 1/-1">
          <label class="field-label">{{ t("customRoles.promptFileLabel") }}</label>
          <PromptPathPicker
            :model-value="role.prompt_path"
            :placeholder="t('customRoles.promptFilePlaceholder')"
            @update:model-value="update(idx, 'prompt_path', $event)"
          />
        </div>
      </div>
      <div class="field">
        <label class="field-label">{{ t("customRoles.promptTextLabel") }}</label>
        <textarea
          class="cr-prompt-text"
          rows="3"
          :placeholder="t('customRoles.promptTextPlaceholder')"
          :value="role.prompt_text"
          @input="
            update(idx, 'prompt_text', ($event.target as HTMLTextAreaElement).value)
          "
        />
      </div>
      <div class="field">
        <label class="field-label">{{ t("customRoles.skillIdsLabel") }}</label>
        <SkillIdsPicker
          :model-value="role.skill_ids"
          :workspace-root="workspaceRoot ?? ''"
          :catalog-ids="catalogIds"
          placeholder="id1, id2"
          @update:model-value="update(idx, 'skill_ids', $event)"
        />
      </div>
      <div style="display: flex; justify-content: flex-end">
        <button type="button" class="btn-icon" title="Remove" @click="remove(idx)">
          &#10005;
        </button>
      </div>
    </div>
    <button type="button" class="btn-secondary" style="margin-top: 6px" @click="add">
      {{ t("customRoles.add") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type {
  CustomRoleSnap,
  CustomRoleUiState,
} from "@/features/custom-roles/useCustomRoles";
import { useI18n } from "@/shared/lib/i18n";
import PromptPathPicker from "@/shared/components/PromptPathPicker.vue";
import SkillIdsPicker from "@/shared/components/SkillIdsPicker.vue";

const { t } = useI18n();

const _fallbackUi: CustomRoleUiState = { modelChoices: [], modelFetchError: null };

const props = defineProps<{
  customRoles: CustomRoleSnap[];
  uiStates?: CustomRoleUiState[];
  workspaceRoot?: string;
  catalogIds?: { id: string; title: string }[];
}>();
const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  update: [idx: number, field: keyof CustomRoleSnap, value: string];
}>();

function uiState(idx: number): CustomRoleUiState {
  return props.uiStates?.[idx] ?? _fallbackUi;
}

function modelSelValue(idx: number): string {
  const role = props.customRoles[idx];
  if (!role) return "";
  const choices = uiState(idx).modelChoices;
  if (!choices.length) return role.model ?? "";
  const hit = choices.find(([v]) => v === role.model);
  return hit ? hit[0] : "__custom__";
}

function onModelChange(idx: number, value: string): void {
  if (value === "__custom__") {
    const current = props.customRoles[idx]?.model ?? "";
    emit("update", idx, "model", current);
  } else {
    emit("update", idx, "model", value);
  }
}

function add(): void {
  emit("add");
}
function remove(idx: number): void {
  emit("remove", idx);
}
function update(idx: number, field: keyof CustomRoleSnap, value: string): void {
  emit("update", idx, field, value);
}
</script>

<style scoped>
.custom-role-row :deep(input),
.custom-role-row :deep(select),
.custom-role-row :deep(textarea) {
  width: 100%;
  min-width: 0;
  font-size: 12px;
}
.model-fetch-error {
  font-size: 10px;
  color: var(--error, #f03e3e);
  word-break: break-word;
}
</style>
