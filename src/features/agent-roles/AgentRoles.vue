<template>
  <details class="section section-agent-models">
    <summary>
      {{ t("agentRoles.summary") }}
      <span
        class="scope-badge scope-badge-project"
        :title="t('agentRoles.projectTitle')"
        >{{ t("agentRoles.project") }}</span
      >
    </summary>
    <div class="section-body section-body-agent-models">
      <div class="hint" style="margin-bottom: 10px">
        {{ t("agentRoles.hint") }}
      </div>
      <div class="agent-models-card">
        <div class="agent-models-card-title">{{ t("agentRoles.rowsTitle") }}</div>
        <button
          v-if="props.onAutoAssign"
          class="auto-assign-btn"
          type="button"
          :title="t('agentRoles.autoAssignTitle')"
          @click="props.onAutoAssign()"
        >
          ⚡ {{ t("agentRoles.autoAssign") }}
        </button>
        <div
          class="role-row role-row--header"
          style="margin-bottom: 8px; font-size: 10px; color: var(--text3)"
        >
          <span class="role-name"></span>
          <span>env</span>
          <span>{{ t("agentRoles.cloudProfile") }}</span>
        </div>

        <template v-for="row in beforeDevSlot" :key="row.configKey">
          <div
            v-if="row.docSubgroup === 'generate_documentation'"
            class="agent-models-subsection-head agent-models-subsection-head--inline"
          >
            <span class="agent-models-subsection-title">{{ docSubgroupTitle }}</span>
            <span class="agent-models-subsection-kicker"
              >step <code>generate_documentation</code></span
            >
          </div>
          <AgentRoleRow
            :role-id="row.configKey"
            :label="row.label"
            :title-hint="row.pipelineStepsHint"
            :state="roleStates[row.configKey]"
            :profile-options="profileOptions"
            @env-change="onEnvChange"
            @profile-change="onProfileChange"
            @model-sel-change="onModelSelChange"
            @model-custom-input="onModelCustomInput"
            @prompt-sel-change="onPromptSelChange"
            @prompt-custom-input="onPromptCustomInput"
            @skill-ids-input="onSkillIdsInput"
          />
        </template>

        <div class="agent-role-chunk agent-role-chunk--sub">
          <div class="hint" style="margin-top: 8px; margin-bottom: 4px">
            <b>Dev Roles</b> — {{ t("agentRoles.devRolesHint") }}
          </div>
          <slot name="dev-roles" />
        </div>

        <AgentRoleRow
          v-for="row in fromDevOnwards"
          :key="row.configKey"
          :role-id="row.configKey"
          :label="row.label"
          :title-hint="row.pipelineStepsHint"
          :state="roleStates[row.configKey]"
          :profile-options="profileOptions"
          @env-change="onEnvChange"
          @profile-change="onProfileChange"
          @model-sel-change="onModelSelChange"
          @model-custom-input="onModelCustomInput"
          @prompt-sel-change="onPromptSelChange"
          @prompt-custom-input="onPromptCustomInput"
          @skill-ids-input="onSkillIdsInput"
        />

        <div class="hint" style="margin-top: 14px; margin-bottom: 6px">
          <strong>Skills</strong>: {{ t("agentRoles.skillsHint") }}
        </div>
        <slot name="skills-catalog" />

        <div class="hint" style="margin-top: 14px; margin-bottom: 6px">
          {{ t("agentRoles.customRolesHint") }}
        </div>
        <slot name="custom-roles" />
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AgentRoleRow from "./AgentRoleRow.vue";
import type { RoleState } from "@/features/agent-roles/useAgentRoles";
import { useI18n } from "@/shared/lib/i18n";
import { splitAgentModelRowsAroundDevSlot } from "@/shared/lib/swarm-constants";

const props = defineProps<{
  roleStates: Record<string, RoleState>;
  profileOptions: { value: string; label: string }[];
  workspaceRoot?: string;
  onAutoAssign?: () => Promise<void>;
}>();

const emit = defineEmits<{
  envChange: [roleId: string, env: string];
  profileChange: [roleId: string, profile: string];
  modelSelChange: [roleId: string, val: string];
  modelCustomInput: [roleId: string, val: string];
  promptSelChange: [roleId: string, val: string];
  promptCustomInput: [roleId: string, val: string];
  skillIdsInput: [roleId: string, val: string];
}>();

const { t } = useI18n();
const { beforeDevSlot, fromDevOnwards } = splitAgentModelRowsAroundDevSlot();
const docSubgroupTitle = computed(() => "Docs + Mermaid");

function onEnvChange(roleId: string, env: string): void {
  emit("envChange", roleId, env);
}
function onProfileChange(roleId: string, p: string): void {
  emit("profileChange", roleId, p);
}
function onModelSelChange(roleId: string, v: string): void {
  emit("modelSelChange", roleId, v);
}
function onModelCustomInput(roleId: string, v: string): void {
  emit("modelCustomInput", roleId, v);
}
function onPromptSelChange(roleId: string, v: string): void {
  emit("promptSelChange", roleId, v);
}
function onPromptCustomInput(roleId: string, v: string): void {
  emit("promptCustomInput", roleId, v);
}
function onSkillIdsInput(roleId: string, v: string): void {
  emit("skillIdsInput", roleId, v);
}
</script>

<style scoped>
.agent-models-subsection-head--inline {
  margin-top: 10px;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border, #2a2f3e);
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.agent-models-subsection-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text2, #a8b0c4);
}
.agent-models-subsection-kicker {
  font-size: 10px;
  color: var(--text3, #6b7280);
  font-family: var(--mono, ui-monospace, monospace);
}
.auto-assign-btn {
  font-size: 11px;
  padding: 3px 10px;
  margin-bottom: 8px;
  background: var(--accent, #3b5bdb);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.9;
}
.auto-assign-btn:hover {
  opacity: 1;
}
</style>
