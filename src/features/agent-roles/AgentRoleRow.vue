<template>
  <div :id="`role-anchor-${roleId}`" class="agent-role-chunk">
    <div class="role-row">
      <span class="role-name" :title="titleHint">{{ label }}</span>
      <select
        :value="state.environment"
        @change="onEnvChange(($event.target as HTMLSelectElement).value)"
      >
        <option v-if="isDesktopShell" value="local">local</option>
        <option value="ollama">ollama</option>
        <option value="lmstudio">lmstudio</option>
        <option value="cloud">cloud</option>
      </select>
      <div class="role-cloud-model-stack">
        <select
          v-if="state.showProfileSelect"
          class="cfg-remote-profile"
          :value="state.remoteProfile"
          :title="t('agentRoleRow.cloudProfile')"
          @change="onProfileChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="">{{ t("agentRoleRow.profilePlaceholder") }}</option>
          <option v-for="opt in profileOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <span
          v-if="state.modelFetchError"
          class="model-fetch-error"
          :title="state.modelFetchError"
        >
          ⚠ {{ state.modelFetchError }}
        </span>
        <select
          v-else
          :value="state.modelSel"
          @change="onModelSelChange(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="[val, lbl] in state.modelChoices" :key="val" :value="val">
            {{ lbl }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="modelHint" class="role-hint">
      <span
        v-if="needsToolCalling"
        class="role-hint-badge"
        :title="t('agentRoleRow.toolCalling')"
        >⚠ tool calling</span
      >
      {{ modelHint }}
    </div>

    <input
      v-if="state.modelSel === '__custom__'"
      class="cfg-custom"
      type="text"
      :placeholder="t('agentRoleRow.modelIdPlaceholder')"
      :value="state.modelCustom"
      @input="onModelCustomInput(($event.target as HTMLInputElement).value)"
    />

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
import { isDesktop } from "@/shared/lib/desktop-bridge";
import { ROLE_NEEDS_TOOL_CALLING, ROLE_MODEL_HINT } from "@/shared/lib/swarm-constants";
import type { RoleId } from "@/shared/lib/swarm-constants";
import SkillIdsPicker from "@/shared/components/SkillIdsPicker.vue";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";
import PromptEditorDialog from "@/shared/components/PromptEditorDialog.vue";
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
const isDesktopShell = isDesktop();

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
