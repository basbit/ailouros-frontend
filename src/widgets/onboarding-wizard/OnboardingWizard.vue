<template>
  <div v-if="shouldShow" class="onboarding-wizard">
    <div v-if="isCollapsed" class="wizard-collapsed" @click="isCollapsed = false">
      <span class="wiz-collapsed-title">{{ t("onboarding.setupTitle") }}</span>
      <span class="wiz-mcp-summary">
        <template v-if="hasPreflight">
          <span
            v-for="(info, name) in mcpPreflight"
            :key="name"
            class="mcp-dot"
            :class="info.status"
          >
            {{ info.status === "ok" ? "✓" : info.status === "failed" ? "✗" : "○" }}
            {{ name }}
          </span>
        </template>
        <template v-else>
          <span class="wiz-hint">{{ t("onboarding.clickToConfigure") }}</span>
        </template>
      </span>
      <button class="btn-ghost wiz-expand-btn" @click.stop="isCollapsed = false">
        ▼ {{ t("onboarding.expand") }}
      </button>
    </div>

    <div v-else class="wizard-panel">
      <div class="wizard-header">
        <span class="wizard-title">
          <template v-if="step === 1">{{ t("onboarding.setupTitle") }}</template>
          <template v-else-if="step === 2">{{ t("onboarding.reviewTitle") }}</template>
          <template v-else>{{ t("onboarding.appliedTitle") }}</template>
        </span>
        <button class="btn-ghost" @click="isCollapsed = true">
          ▲ {{ t("onboarding.collapse") }}
        </button>
      </div>

      <StepScan
        v-if="step === 1"
        :local-root="localRoot"
        :scanning="scanning"
        :preconfigurating="preconfigurating"
        :scan-error="scanError"
        @update:local-root="localRoot = $event"
        @scan="runScan"
        @preconfigure="runAiPreconfigure"
      />

      <StepReview
        v-else-if="step === 2"
        :scan-result="scanResult"
        :context-preview="contextPreview"
        :mcp-servers="mcpServers"
        :model-assignments="modelAssignments"
        :applying="applying"
        :apply-error="applyError"
        @update:context-preview="contextPreview = $event"
        @cancel="step = 1"
        @apply="applyConfig"
      />

      <StepApplied
        v-else-if="step === 3"
        :mcp-preflight="mcpPreflight"
        :recommended-capabilities="recommendedCapabilities"
        :recommended-servers="recommendedServers"
        @done="isCollapsed = true"
        @rerun="reRunPreconfigure"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelAssignment } from "@/shared/model/onboarding-types";
import { useOnboardingWizard } from "./useOnboardingWizard";
import { useI18n } from "@/shared/lib/i18n";
import StepScan from "./steps/StepScan.vue";
import StepReview from "./steps/StepReview.vue";
import StepApplied from "./steps/StepApplied.vue";

const props = defineProps<{
  workspaceRoot: string;
  tavilyApiKey?: string;
  exaApiKey?: string;
  scrapingdogApiKey?: string;
}>();

const emit = defineEmits<{
  applied: [];
  dismissed: [];
  "model-assignments": [assignments: ModelAssignment[]];
}>();
const { t } = useI18n();

const {
  step,
  localRoot,
  scanning,
  preconfigurating,
  applying,
  isCollapsed,
  scanResult,
  mcpServers,
  mcpPreflight,
  recommendedCapabilities,
  recommendedServers,
  modelAssignments,
  contextPreview,
  scanError,
  applyError,
  shouldShow,
  hasPreflight,
  runScan,
  runAiPreconfigure,
  applyConfig,
  reRunPreconfigure,
} = useOnboardingWizard(
  () => props.workspaceRoot,
  emit,
  () => ({
    tavily_api_key: props.tavilyApiKey ?? "",
    exa_api_key: props.exaApiKey ?? "",
    scrapingdog_api_key: props.scrapingdogApiKey ?? "",
  }),
);
</script>

<style scoped>
.onboarding-wizard {
  width: 100%;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  z-index: 50;
}

.wizard-collapsed {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 18px;
  cursor: pointer;
  min-height: 36px;
}
.wiz-collapsed-title {
  font-weight: 600;
  font-size: 12px;
  color: var(--text2);
  white-space: nowrap;
}
.mcp-dot {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
}
.mcp-dot.ok {
  color: var(--success);
  border-color: var(--success);
}
.mcp-dot.failed {
  color: var(--error);
  border-color: var(--error);
}
.mcp-dot.pending {
  color: var(--text2);
}
.wiz-expand-btn {
  margin-left: auto;
  font-size: 11px;
}

.wizard-panel {
  display: flex;
  flex-direction: column;
}
.wizard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}
.wizard-title {
  font-weight: 600;
  font-size: 13px;
}
.wiz-hint {
  color: var(--text2);
  font-size: 11px;
}
</style>
