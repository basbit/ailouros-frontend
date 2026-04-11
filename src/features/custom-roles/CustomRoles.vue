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
          <input
            type="text"
            class="cr-model"
            placeholder="model id"
            autocomplete="off"
            :value="role.model"
            @input="update(idx, 'model', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label class="field-label">{{ t("customRoles.promptFileLabel") }}</label>
          <input
            type="text"
            class="cr-prompt-path"
            :placeholder="t('customRoles.promptFilePlaceholder')"
            autocomplete="off"
            :value="role.prompt_path"
            @input="
              update(idx, 'prompt_path', ($event.target as HTMLInputElement).value)
            "
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
        <input
          type="text"
          class="cr-skill-ids"
          placeholder="id1, id2"
          autocomplete="off"
          :value="role.skill_ids"
          @input="update(idx, 'skill_ids', ($event.target as HTMLInputElement).value)"
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
import type { CustomRoleSnap } from "@/features/custom-roles/useCustomRoles";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

defineProps<{ customRoles: CustomRoleSnap[] }>();
const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  update: [idx: number, field: keyof CustomRoleSnap, value: string];
}>();

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
