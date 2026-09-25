<template>
  <div class="agentic-settings">
    <SettingsSyncError />
    <fieldset class="agentic-section">
      <legend>{{ t("settings.agentic.scheduler.legend") }}</legend>
      <p class="hint">{{ t("settings.agentic.scheduler.intro") }}</p>
      <SettingsToggleField
        field="swarm_goal_scheduler_enabled"
        env-name="SWARM_GOAL_SCHEDULER_ENABLED"
        :label="t('settings.agentic.scheduler.enabled.label')"
        :help="t('settings.agentic.scheduler.enabled.help')"
      />
      <SettingPrerequisite
        v-if="state.swarm_goal_scheduler_enabled && !state.swarm_allow_workspace_write"
        pane="agentic"
        field="swarm_allow_workspace_write"
        :message="t('settings.agentic.scheduler.needsWrite')"
      />
      <SettingsTextField
        field="swarm_goal_scheduler_timezone"
        env-name="SWARM_GOAL_SCHEDULER_TIMEZONE"
        placeholder="UTC"
        :label="t('settings.agentic.scheduler.timezone.label')"
        :help="t('settings.agentic.scheduler.timezone.help')"
      />
      <SettingsTextField
        field="swarm_goal_scheduler_misfire_grace_seconds"
        env-name="SWARM_GOAL_SCHEDULER_MISFIRE_GRACE_SECONDS"
        placeholder="60"
        numeric
        :min="1"
        :max="86400"
        :label="t('settings.agentic.scheduler.grace.label')"
        :help="t('settings.agentic.scheduler.grace.help')"
      />
    </fieldset>

    <fieldset class="agentic-section">
      <legend>{{ t("settings.agentic.autoresearch.legend") }}</legend>
      <p class="hint">{{ t("settings.agentic.autoresearch.intro") }}</p>
      <SettingsToggleField
        field="swarm_allow_workspace_write"
        env-name="SWARM_ALLOW_WORKSPACE_WRITE"
        :label="t('settings.agentic.autoresearch.write.label')"
        :help="t('settings.agentic.autoresearch.write.help')"
      />
      <SettingsToggleField
        field="swarm_allow_command_exec"
        env-name="SWARM_ALLOW_COMMAND_EXEC"
        :label="t('settings.agentic.autoresearch.exec.label')"
        :help="t('settings.agentic.autoresearch.exec.help')"
      />
      <SettingsTextField
        field="swarm_shell_allowlist"
        env-name="SWARM_SHELL_ALLOWLIST"
        placeholder="pytest,npm,node"
        :label="t('settings.agentic.autoresearch.allowlist.label')"
        :help="t('settings.agentic.autoresearch.allowlist.help')"
      />
      <SettingsTextField
        field="swarm_autoresearch_context_max_chars"
        env-name="SWARM_AUTORESEARCH_CONTEXT_MAX_CHARS"
        placeholder="60000"
        numeric
        :min="1000"
        :max="2000000"
        :label="t('settings.agentic.autoresearch.context.label')"
        :help="t('settings.agentic.autoresearch.context.help')"
      />
    </fieldset>

    <fieldset class="agentic-section">
      <legend>{{ t("settings.agentic.isolation.legend") }}</legend>
      <SettingsSelectField
        field="swarm_workspace_isolation_mode"
        env-name="SWARM_WORKSPACE_ISOLATION_MODE"
        :options="isolationOptions"
        :label="t('settings.agentic.isolation.mode.label')"
        :help="t('settings.agentic.isolation.mode.help')"
      />
    </fieldset>

    <fieldset class="agentic-section">
      <legend>{{ t("settings.agentic.learning.legend") }}</legend>
      <SettingsToggleField
        field="swarm_cross_task_memory"
        env-name="SWARM_CROSS_TASK_MEMORY"
        :label="t('settings.agentic.learning.crossTask.label')"
        :help="t('settings.agentic.learning.crossTask.help')"
      />
      <SettingsTextField
        field="swarm_cross_task_inject_steps"
        env-name="SWARM_CROSS_TASK_INJECT_STEPS"
        placeholder="pm,ba,architect,clarify_input,qa"
        :label="t('settings.agentic.learning.injectSteps.label')"
        :help="t('settings.agentic.learning.injectSteps.help')"
      />
      <SettingPrerequisite
        v-if="!state.swarm_cross_task_memory && state.swarm_cross_task_inject_steps.trim()"
        pane="agentic"
        field="swarm_cross_task_memory"
        :message="t('settings.agentic.learning.injectSteps.needsMemory')"
      />
      <SettingsTextField
        field="swarm_dev_past_user_feedback_per_file"
        env-name="SWARM_DEV_PAST_USER_FEEDBACK_PER_FILE"
        placeholder="3"
        numeric
        :min="0"
        :max="50"
        :label="t('settings.agentic.learning.feedback.label')"
        :help="t('settings.agentic.learning.feedback.help')"
      />
    </fieldset>

    <fieldset class="agentic-section">
      <legend>{{ t("settings.agentic.elsewhere.legend") }}</legend>
      <ul class="agentic-elsewhere">
        <li>
          <RouterLink to="/settings/remote-control">{{ t("settings.agentic.elsewhere.remote") }}</RouterLink>
        </li>
        <li>
          <RouterLink to="/settings/issue-autopilot">{{ t("settings.agentic.elsewhere.autopilot") }}</RouterLink>
        </li>
        <li>
          <RouterLink to="/settings/notifications">{{ t("settings.agentic.elsewhere.notifications") }}</RouterLink>
        </li>
        <li>{{ t("settings.agentic.elsewhere.promptEval") }}</li>
      </ul>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import SettingsSyncError from "@/shared/components/settings-fields/SettingsSyncError.vue";
import SettingsToggleField from "@/shared/components/settings-fields/SettingsToggleField.vue";
import SettingsTextField from "@/shared/components/settings-fields/SettingsTextField.vue";
import SettingsSelectField from "@/shared/components/settings-fields/SettingsSelectField.vue";
import SettingPrerequisite from "@/shared/components/settings-fields/SettingPrerequisite.vue";

const { t } = useI18n();
const { state, loadFromBackend } = useGlobalSearchKeys();

const isolationOptions = computed(() => [
  { value: "", label: t("settings.agentic.isolation.default") },
  { value: "none", label: t("settings.agentic.isolation.none") },
  { value: "worktree", label: t("settings.agentic.isolation.worktree") },
]);

onMounted(() => {
  void loadFromBackend();
});
</script>

<style scoped>
.agentic-settings {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.agentic-section {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 10px 14px;
}
.agentic-section legend {
  font-weight: 600;
}
.agentic-elsewhere {
  margin: 0;
  padding-left: 18px;
}
</style>
