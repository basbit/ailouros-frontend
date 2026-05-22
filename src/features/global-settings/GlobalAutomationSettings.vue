<template>
  <div class="autonomous-settings-fields">
    <AutonomousToggleWithPicker
      :enabled="state.swarm_self_verify"
      :model="state.swarm_self_verify_model"
      :provider="state.swarm_self_verify_provider"
      :connection="connection"
      toggle-field="swarm_self_verify"
      :toggle-label="t('auto.selfVerifyLabel')"
      :toggle-hint="t('auto.selfVerifyHint')"
      :model-label="t('auto.selfVerifyModelLabel')"
      model-field="swarm_self_verify_model"
      provider-field="swarm_self_verify_provider"
      :model-custom-placeholder="t('auto.modelIdPlaceholder')"
      model-env-code="SWARM_SELF_VERIFY_MODEL"
      @update:form="onUpdate"
    >
      <template #hint>
        {{ t("auto.selfVerifyHint") }}
        <code>SWARM_SELF_VERIFY</code>.
      </template>
    </AutonomousToggleWithPicker>

    <div class="field">
      <label class="field-label" for="global_swarm_auto_approve">{{
        t("auto.autoApproveLabel")
      }}</label>
      <select
        id="global_swarm_auto_approve"
        :value="state.swarm_auto_approve"
        @change="
          onUpdate('swarm_auto_approve', ($event.target as HTMLSelectElement).value)
        "
      >
        <option value="">{{ t("auto.autoApprove.default") }}</option>
        <option value="0">{{ t("auto.autoApprove.off") }}</option>
        <option value="policy">{{ t("auto.autoApprove.policy") }}</option>
        <option value="1">{{ t("auto.autoApprove.on") }}</option>
      </select>
      <div class="hint">Env: <code>SWARM_AUTO_APPROVE</code></div>
    </div>
    <div class="field">
      <label class="field-label" for="global_swarm_auto_approve_timeout">{{
        t("auto.autoApproveTimeoutLabel")
      }}</label>
      <input
        id="global_swarm_auto_approve_timeout"
        type="number"
        min="0"
        placeholder="3600"
        :value="state.swarm_auto_approve_timeout"
        @input="
          onUpdate(
            'swarm_auto_approve_timeout',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">
        {{ t("auto.autoApproveTimeoutHint") }}
        <code>SWARM_AUTO_APPROVE_TIMEOUT_SECONDS</code>
      </div>
    </div>

    <div class="field">
      <label class="checkbox-row">
        <input
          id="global_swarm_auto_retry"
          type="checkbox"
          :checked="state.swarm_auto_retry"
          @change="
            onUpdate(
              'swarm_auto_retry',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.autoRetryLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.autoRetryHint") }}
        <code>SWARM_AUTO_RETRY_ON_NEEDS_WORK</code>
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="global_swarm_max_step_retries">{{
        t("auto.maxRetriesLabel")
      }}</label>
      <input
        id="global_swarm_max_step_retries"
        type="number"
        min="1"
        max="10"
        placeholder="2"
        :value="state.swarm_max_step_retries"
        @input="
          onUpdate('swarm_max_step_retries', ($event.target as HTMLInputElement).value)
        "
      />
      <div class="hint">Env: <code>SWARM_MAX_STEP_RETRIES</code></div>
    </div>

    <AutonomousToggleWithPicker
      :enabled="state.swarm_deep_planning"
      :model="state.swarm_deep_planning_model"
      :provider="state.swarm_deep_planning_provider"
      :connection="connection"
      toggle-field="swarm_deep_planning"
      :toggle-label="t('auto.deepPlanningLabel')"
      :toggle-hint="t('auto.deepPlanningHint')"
      :model-label="t('auto.deepPlanningModelLabel')"
      model-field="swarm_deep_planning_model"
      provider-field="swarm_deep_planning_provider"
      :model-custom-placeholder="t('auto.modelIdPlaceholder')"
      model-env-code="SWARM_DEEP_PLANNING_MODEL"
      @update:form="onUpdate"
    >
      <template #hint>
        {{ t("auto.deepPlanningHint") }}
        Env: <code>SWARM_DEEP_PLANNING</code>
      </template>
    </AutonomousToggleWithPicker>

    <AutonomousBackgroundAgentForm
      :enabled="state.swarm_background_agent"
      :watch-paths="state.swarm_background_watch_paths"
      :model="state.swarm_background_agent_model"
      :provider="state.swarm_background_agent_provider"
      :connection="connection"
      @update:form="onUpdate"
    />

    <div class="field">
      <label class="checkbox-row">
        <input
          id="global_swarm_dream_enabled"
          type="checkbox"
          :checked="state.swarm_dream_enabled"
          @change="
            onUpdate(
              'swarm_dream_enabled',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.memoryConsolidationLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.memoryConsolidationHint") }}
        <em>{{ t("auto.experimentalHint") }}</em>
      </div>
    </div>

    <div class="field">
      <label class="checkbox-row">
        <input
          id="global_swarm_quality_gate"
          type="checkbox"
          :checked="state.swarm_quality_gate"
          @change="
            onUpdate(
              'swarm_quality_gate',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.qualityGateLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.qualityGateHint") }}
        <code>SWARM_AUTO_RETRY_ON_NEEDS_WORK</code>.
      </div>
    </div>

    <AutonomousToggleWithPicker
      :enabled="state.swarm_auto_plan"
      :model="state.swarm_planner_model"
      :provider="state.swarm_planner_provider"
      :connection="connection"
      toggle-field="swarm_auto_plan"
      :toggle-label="t('auto.autoPlanLabel')"
      :toggle-hint="t('auto.autoPlanHint')"
      :model-label="t('auto.plannerModelLabel')"
      model-field="swarm_planner_model"
      provider-field="swarm_planner_provider"
      model-custom-placeholder="deepseek-r1:14b"
      :show-picker-only-when-enabled="true"
      @update:form="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import AutonomousToggleWithPicker from "@/features/global-settings/autonomous/AutonomousToggleWithPicker.vue";
import AutonomousBackgroundAgentForm from "@/features/global-settings/autonomous/AutonomousBackgroundAgentForm.vue";
import type { GlobalSettingsData } from "./useGlobalSettings";

const { t } = useI18n();
const { state, setKey } = useGlobalSettings();

const props = defineProps<{
  remoteApiProvider?: string;
  remoteApiKey?: string;
  remoteApiBaseUrl?: string;
}>();

// Cloud connection is still project-scoped (stored in the current project's
// remote_api fields). Forms below use it only to discover cloud model ids.
const connection = computed(() => ({
  remote_api_provider: props.remoteApiProvider ?? "",
  remote_api_key: props.remoteApiKey ?? "",
  remote_api_base_url: props.remoteApiBaseUrl ?? "",
}));

const _BOOL_FIELDS: ReadonlySet<string> = new Set([
  "swarm_self_verify",
  "swarm_auto_retry",
  "swarm_deep_planning",
  "swarm_background_agent",
  "swarm_dream_enabled",
  "swarm_quality_gate",
  "swarm_auto_plan",
]);

function onUpdate(field: string, value: string): void {
  if (!(field in state)) return;
  if (_BOOL_FIELDS.has(field)) {
    setKey(field as keyof GlobalSettingsData, value === "true");
  } else {
    setKey(field as keyof GlobalSettingsData, value);
  }
}
</script>
