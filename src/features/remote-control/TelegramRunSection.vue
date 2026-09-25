<template>
  <fieldset class="remote-section">
    <legend>{{ t("remoteControl.run.legend") }}</legend>
    <p class="hint">{{ t("remoteControl.run.intro") }}</p>
    <SettingPrerequisite
      v-if="!state.swarm_telegram_ingress_enabled"
      pane="remote-control"
      field="swarm_telegram_ingress_enabled"
      :message="t('remoteControl.run.needsBot')"
    />
    <SettingsTextField
      field="swarm_telegram_ingress_run_chat_ids"
      env-name="SWARM_TELEGRAM_INGRESS_RUN_CHAT_IDS"
      placeholder="123456789"
      :label="t('remoteControl.run.chats.label')"
      :help="t('remoteControl.run.chats.help')"
    />
    <div class="field">
      <span class="field-label">{{ t("remoteControl.run.workspace.label") }}</span>
      <FilePathPicker
        :model-value="state.swarm_telegram_ingress_run_workspace"
        :directory="true"
        placeholder="/abs/path/to/git/repo"
        @update:model-value="(value) => setKey('swarm_telegram_ingress_run_workspace', value)"
      />
      <div class="hint">
        {{ t("remoteControl.run.workspace.help") }}
        <code>SWARM_TELEGRAM_INGRESS_RUN_WORKSPACE</code>
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="settings_swarm_telegram_ingress_run_scenario">
        {{ t("remoteControl.run.scenario.label") }}
      </label>
      <select
        id="settings_swarm_telegram_ingress_run_scenario"
        data-test="run-scenario"
        :value="state.swarm_telegram_ingress_run_scenario"
        @change="setKey('swarm_telegram_ingress_run_scenario', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ t("remoteControl.run.scenario.default") }}</option>
        <option v-for="scenario in scenarios" :key="scenario.id" :value="scenario.id">
          {{ scenario.title }} ({{ scenario.id }})
        </option>
      </select>
      <div class="hint">
        {{ scenarioError || t("remoteControl.run.scenario.help") }}
        <code>SWARM_TELEGRAM_INGRESS_RUN_SCENARIO</code>
      </div>
    </div>
    <SettingsTextField
      field="swarm_telegram_ingress_run_max_per_hour"
      env-name="SWARM_TELEGRAM_INGRESS_RUN_MAX_PER_HOUR"
      placeholder="4"
      numeric
      :min="1"
      :max="100"
      :label="t('remoteControl.run.perHour.label')"
      :help="t('remoteControl.run.perHour.help')"
    />
  </fieldset>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import { describeApiError } from "@/shared/api/api-error-detail";
import { listScenarios } from "@/shared/api/endpoints/scenarios";
import FilePathPicker from "@/shared/components/FilePathPicker.vue";
import SettingsTextField from "@/shared/components/settings-fields/SettingsTextField.vue";
import SettingPrerequisite from "@/shared/components/settings-fields/SettingPrerequisite.vue";

const { t } = useI18n();
const { state, setKey } = useGlobalSearchKeys();
const scenarios = ref<Array<{ id: string; title: string }>>([]);
const scenarioError = ref("");

onMounted(async () => {
  try {
    const response = await listScenarios();
    scenarios.value = response.scenarios.map(({ id, title }) => ({ id, title }));
  } catch (err) {
    scenarioError.value = t("remoteControl.run.scenario.loadFailed", { reason: describeApiError(err) });
  }
});
</script>
