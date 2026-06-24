<template>
  <div :id="`role-anchor-${roleId}`" class="agent-role-chunk">
    <ModelPickerField
      :environment="state.environment"
      :model-choices="state.modelChoices"
      :model-sel="state.modelSel"
      :model-custom="state.modelCustom"
      :model-fetch-error="state.modelFetchError"
      :profile-options="profileOptions"
      :remote-profile="state.remoteProfile"
      :show-profile-select="state.showProfileSelect"
      :custom-placeholder="t('agentRoleRow.modelIdPlaceholder')"
      :profile-placeholder="t('agentRoleRow.profilePlaceholder')"
      :cloud-profile-title="t('agentRoleRow.cloudProfile')"
      @update:environment="onEnvChange"
      @update:remote-profile="onProfileChange"
      @update:model-sel="onModelSelChange"
      @update:model-custom="onModelCustomInput"
    >
      <template #leading>
        <span class="role-name" :title="titleHint">{{ label }}</span>
      </template>
      <template #hint>
        <div v-if="modelHint" class="role-hint">
          <span
            v-if="needsToolCalling"
            class="role-hint-badge"
            :title="t('agentRoleRow.toolCalling')"
            >⚠ tool calling</span
          >
          {{ modelHint }}
        </div>
      </template>
    </ModelPickerField>

    <div class="role-prompt-row">
      <span></span>
      <div class="role-prompt-row__select">
        <select
          :value="state.promptSel"
          @change="onPromptSelChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="[val, lbl] in state.promptChoices" :key="val" :value="val">
            {{ lbl }}
          </option>
        </select>
        <button
          type="button"
          class="role-prompt-row__edit"
          :title="t('promptEditor.openLabel')"
          @click="promptEditorOpen = true"
        >
          {{ t("promptEditor.openLabel") }}
        </button>
      </div>
    </div>

    <FilePathPicker
      v-if="state.promptSel === '__custom__'"
      :model-value="state.promptCustom"
      :placeholder="t('agentRoleRow.promptPathPlaceholder')"
      :file-extensions="['md', 'markdown']"
      style="margin-bottom: 8px"
      @update:model-value="onPromptCustomInput($event)"
    />

    <div class="role-prompt-text-row">
      <label class="field-label" :for="`cfg_${roleId}_prompt_text`">{{
        t("agentRoleRow.promptTextLabel")
      }}</label>
      <textarea
        :id="`cfg_${roleId}_prompt_text`"
        class="role-prompt-text"
        rows="3"
        :placeholder="t('agentRoleRow.promptTextPlaceholder')"
        :value="state.promptText"
        @input="onPromptTextInput(($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="field" style="margin-bottom: 8px">
      <label class="field-label" :for="`cfg_${roleId}_skill_ids`">{{
        t("agentRoleRow.skillIdsLabel")
      }}</label>
      <SkillIdsPicker
        :model-value="state.skillIds"
        :workspace-root="workspaceRoot ?? ''"
        :catalog-ids="catalogIds"
        :placeholder="t('agentRoleRow.skillIdsPlaceholder')"
        @update:model-value="onSkillIdsInput($event)"
      />
    </div>

    <slot name="extras" />
  </div>
  <PromptEditorDialog
    :open="promptEditorOpen"
    :initial-path="initialPromptPathForEditor"
    @close="promptEditorOpen = false"
    @saved="onPromptSaved"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { RoleState } from "@/features/agent-roles/useAgentRoles";
import { useI18n } from "@/shared/lib/i18n";
import { ROLE_NEEDS_TOOL_CALLING, ROLE_MODEL_HINT } from "@/shared/lib/swarm-constants";
import type { RoleId } from "@/shared/lib/swarm-constants";
import ModelPickerField from "@/shared/components/ModelPickerField.vue";
import SkillIdsPicker from "@/shared/components/SkillIdsPicker.vue";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";
import PromptEditorDialog from "@/entities/prompt-template/ui/PromptEditorDialog.vue";
import type { AgentRoleEmitMap } from "./agent-role-events";

const props = defineProps<{
  roleId: string;
  label: string;
  titleHint?: string;
  state: RoleState;
  profileOptions: { value: string; label: string }[];
  workspaceRoot?: string;
  catalogIds?: { id: string; title: string }[];
}>();
const { t } = useI18n();

const needsToolCalling = ROLE_NEEDS_TOOL_CALLING[props.roleId as RoleId] ?? false;
const modelHint = ROLE_MODEL_HINT[props.roleId as RoleId] ?? "";

const emit = defineEmits<AgentRoleEmitMap>();

function onEnvChange(env: string): void {
  emit("envChange", props.roleId, env);
}
function onProfileChange(profile: string): void {
  emit("profileChange", props.roleId, profile);
}
function onModelSelChange(val: string): void {
  emit("modelSelChange", props.roleId, val);
}
function onModelCustomInput(val: string): void {
  emit("modelCustomInput", props.roleId, val);
}
function onPromptSelChange(val: string): void {
  emit("promptSelChange", props.roleId, val);
}
function onPromptCustomInput(val: string): void {
  emit("promptCustomInput", props.roleId, val);
}
function onPromptTextInput(val: string): void {
  emit("promptTextInput", props.roleId, val);
}
function onSkillIdsInput(val: string): void {
  emit("skillIdsInput", props.roleId, val);
}

const promptEditorOpen = ref(false);
const initialPromptPathForEditor = computed(() =>
  props.state.promptSel === "__custom__"
    ? props.state.promptCustom
    : props.state.promptSel,
);

function onPromptSaved(path: string): void {
  emit("promptSelChange", props.roleId, "__custom__");
  emit("promptCustomInput", props.roleId, path);
  promptEditorOpen.value = false;
}
</script>

<style scoped>
.role-prompt-row__select {
  display: flex;
  gap: 6px;
  align-items: stretch;
  min-width: 0;
}
.role-prompt-row__select select {
  flex: 1;
  min-width: 0;
}
.role-prompt-row__edit {
  background: var(--accent, #3b5bdb);
  color: #fff;
  border: 1px solid var(--accent, #3b5bdb);
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}
.role-hint {
  font-size: 10px;
  color: var(--text3, #6b7280);
  margin: 2px 0 6px 0;
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.role-hint-badge {
  background: #7c3aed22;
  color: #a78bfa;
  border: 1px solid #7c3aed44;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 10px;
  white-space: nowrap;
}
.role-prompt-text-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.role-prompt-text {
  width: 100%;
  min-height: 60px;
  font-size: 12px;
  font-family: var(--mono, ui-monospace, monospace);
  resize: vertical;
}
</style>
