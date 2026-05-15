<template>
  <AgentRoles
    :role-states="settings.rolesState.roleStates"
    :profile-options="profileOptions"
    :workspace-root="settings.form.workspace_root"
    :catalog-ids="skillsCatalogIds"
    :on-auto-assign="onAutoAssignModels"
    :media-form="mediaForm"
    @env-change="(roleId, env) => emit('role-env-change', roleId, env)"
    @profile-change="(roleId, val) => emit('role-profile-change', roleId, val)"
    @model-sel-change="(roleId, val) => emit('role-model-sel-change', roleId, val)"
    @model-custom-input="(roleId, val) => emit('role-model-custom-input', roleId, val)"
    @prompt-sel-change="(roleId, val) => emit('role-prompt-sel-change', roleId, val)"
    @prompt-custom-input="
      (roleId, val) => emit('role-prompt-custom-input', roleId, val)
    "
    @skill-ids-input="(roleId, val) => emit('role-skill-ids-input', roleId, val)"
    @media-update="(field, val) => emit('swarm-form-update', field, val)"
  >
    <template #dev-roles>
      <DevRoles
        :dev-roles="settings.devRolesState.devRoles.value"
        :ui-states="settings.devRolesState.uiStates"
        @add="settings.devRolesState.add()"
        @remove="(idx) => settings.devRolesState.remove(idx)"
        @update="(idx, field, val) => settings.devRolesState.update(idx, field, val)"
      />
    </template>
    <template #skills-catalog>
      <SkillsCatalog
        :skills="settings.skillsState.skills.value"
        @add="settings.skillsState.add()"
        @remove="(idx) => settings.skillsState.remove(idx)"
        @update="(idx, field, val) => settings.skillsState.update(idx, field, val)"
      />
    </template>
    <template #custom-roles>
      <CustomRoles
        :custom-roles="settings.customRolesState.customRoles.value"
        :ui-states="settings.customRolesState.uiStates"
        :workspace-root="settings.form.workspace_root"
        :catalog-ids="skillsCatalogIds"
        @add="settings.customRolesState.add()"
        @remove="(idx) => settings.customRolesState.remove(idx)"
        @update="(idx, field, val) => settings.customRolesState.update(idx, field, val)"
      />
    </template>
  </AgentRoles>
</template>

<script setup lang="ts">
import AgentRoles from "@/features/agent-roles/AgentRoles.vue";
import DevRoles from "@/features/dev-roles/DevRoles.vue";
import SkillsCatalog from "@/features/skills-catalog/SkillsCatalog.vue";
import CustomRoles from "@/features/custom-roles/CustomRoles.vue";
import type { useSettings } from "@/widgets/settings/useSettings";

type SettingsApi = ReturnType<typeof useSettings>;

interface MediaFormShape {
  media_enabled: boolean;
  media_image_provider: string;
  media_image_model: string;
  media_image_api_key: string;
  media_audio_provider: string;
  media_audio_model: string;
  media_audio_api_key: string;
  media_audio_voice: string;
  media_budget_max_cost_usd: string;
  media_budget_max_attempts: string;
  media_license_policy: string;
}

defineProps<{
  settings: SettingsApi;
  profileOptions: { value: string; label: string }[];
  skillsCatalogIds: { id: string; title: string }[];
  mediaForm: MediaFormShape;
  onAutoAssignModels: () => Promise<void>;
}>();

const emit = defineEmits<{
  (e: "role-env-change", roleId: string, env: string): void;
  (e: "role-profile-change", roleId: string, profile: string): void;
  (e: "role-model-sel-change", roleId: string, val: string): void;
  (e: "role-model-custom-input", roleId: string, val: string): void;
  (e: "role-prompt-sel-change", roleId: string, val: string): void;
  (e: "role-prompt-custom-input", roleId: string, val: string): void;
  (e: "role-skill-ids-input", roleId: string, val: string): void;
  (e: "swarm-form-update", field: string, value: string): void;
}>();
</script>
