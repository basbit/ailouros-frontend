<template>
  <section class="models-pane">
    <PaneHeader
      :title="t('configure.models.title')"
      :subtitle="t('configure.models.subtitle')"
    >
      <template #actions>
        <button
          type="button"
          class="models-pane__auto"
          :disabled="autoAssigning"
          @click="onAutoAssign"
        >
          {{ t("configure.models.autoAssign") }}
        </button>
      </template>
    </PaneHeader>

    <p class="models-pane__banner">{{ t("configure.apiKeysBanner") }}</p>

    <AgentRoles
      flat
      :role-states="settings.rolesState.roleStates"
      :profile-options="profileOptions"
      :workspace-root="settings.form.workspace_root"
      :catalog-ids="skillsCatalogIds"
      :on-auto-assign="onAutoAssign"
      :media-form="mediaForm"
      @env-change="onRoleEnvChange"
      @profile-change="onRoleProfileChange"
      @model-sel-change="onRoleModelSelChange"
      @model-custom-input="onRoleModelCustomInput"
      @prompt-sel-change="onRolePromptSelChange"
      @prompt-custom-input="onRolePromptCustomInput"
      @prompt-text-input="onRolePromptTextInput"
      @skill-ids-input="onRoleSkillIdsInput"
      @media-update="onMediaUpdate"
    >
      <template #dev-roles>
        <DevRoles
          :dev-roles="settings.devRolesState.devRoles.value"
          :ui-states="settings.devRolesState.uiStates"
          @add="settings.devRolesState.add()"
          @remove="(idx) => settings.devRolesState.remove(idx)"
          @update="
            (idx, field, value) => settings.devRolesState.update(idx, field, value)
          "
        />
      </template>
      <template #skills-catalog>
        <SkillsCatalog
          :skills="settings.skillsState.skills.value"
          @add="settings.skillsState.add()"
          @remove="(idx) => settings.skillsState.remove(idx)"
          @update="
            (idx, field, value) => settings.skillsState.update(idx, field, value)
          "
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
          @update="
            (idx, field, value) => settings.customRolesState.update(idx, field, value)
          "
        />
      </template>
    </AgentRoles>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import AgentRoles from "@/features/agent-roles/AgentRoles.vue";
import DevRoles from "@/features/dev-roles/DevRoles.vue";
import SkillsCatalog from "@/features/skills-catalog/SkillsCatalog.vue";
import CustomRoles from "@/features/custom-roles/CustomRoles.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useRoleHandlers } from "@/pages/swarm-ui/useRoleHandlers";
import { useSwarmUiDerived } from "@/pages/swarm-ui/useSwarmUiDerived";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();
const route = useRoute();

async function scrollToHashAnchor(hash: string): Promise<void> {
  if (!hash.startsWith("#role-anchor-")) return;
  const id = hash.slice(1);
  await nextTick();
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("role-anchor--highlight");
  window.setTimeout(() => el.classList.remove("role-anchor--highlight"), 1600);
}

onMounted(() => {
  void scrollToHashAnchor(route.hash);
});

watch(
  () => route.hash,
  (next) => {
    void scrollToHashAnchor(next);
  },
);

const handlers = useRoleHandlers(settings);
const { profileOptions, skillsCatalogIds, mediaForm } = useSwarmUiDerived(settings);
const autoAssigning = ref(false);

async function onAutoAssign(): Promise<void> {
  autoAssigning.value = true;
  try {
    await handlers.onAutoAssignModels();
  } finally {
    autoAssigning.value = false;
  }
}

function onRoleEnvChange(roleId: string, env: string): void {
  handlers.onRoleEnvChange(roleId, env);
}

function onRoleProfileChange(roleId: string, profile: string): void {
  handlers.onRoleProfileChange(roleId, profile);
}

function onRoleModelSelChange(roleId: string, value: string): void {
  handlers.onRoleModelSelChange(roleId, value);
}

function onRoleModelCustomInput(roleId: string, value: string): void {
  handlers.onRoleModelCustomInput(roleId, value);
}

function onRolePromptSelChange(roleId: string, value: string): void {
  handlers.onRolePromptSelChange(roleId, value);
}

function onRolePromptCustomInput(roleId: string, value: string): void {
  handlers.onRolePromptCustomInput(roleId, value);
}

function onRolePromptTextInput(roleId: string, value: string): void {
  handlers.onRolePromptTextInput(roleId, value);
}

function onRoleSkillIdsInput(roleId: string, value: string): void {
  handlers.onRoleSkillIdsInput(roleId, value);
}

function onMediaUpdate(field: string, value: string): void {
  handlers.onSwarmFormUpdate(field, value);
}
</script>

<style scoped>
.models-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
}

.models-pane__auto {
  appearance: none;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
  transition: border-color 0.14s;
}

.models-pane__auto:hover:not(:disabled) {
  border-color: var(--line-strong);
}

.models-pane__auto:disabled {
  opacity: 0.5;
  cursor: progress;
}

.models-pane__banner {
  margin: 0;
  padding: 10px 14px;
  background: var(--accent-soft);
  color: var(--accent-2);
  border-radius: var(--r-md);
  font-size: 12px;
}

.models-pane :deep(.cfg-section-title) {
  font-size: 12px;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.models-pane :deep(.role-anchor--highlight) {
  outline: 2px solid var(--accent, #3b5bdb);
  outline-offset: 2px;
  border-radius: var(--r-md, 6px);
  transition: outline-color 0.3s ease-out;
}
</style>
