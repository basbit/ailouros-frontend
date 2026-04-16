<template>
  <div v-if="shouldShow" class="onboarding-wizard">
    <!-- Collapsed state: just show status bar -->
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

    <!-- Expanded state -->
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

      <!-- Step 1: Scan & Pre-configure -->
      <div v-if="step === 1" class="wizard-body">
        <div class="wizard-field-row">
          <label class="wiz-label">{{ t("onboarding.workspace") }}</label>
          <input
            class="wiz-input"
            type="text"
            :value="localRoot"
            placeholder="/path/to/project"
            @input="localRoot = ($event.target as HTMLInputElement).value"
          />
        </div>
        <div class="wizard-actions">
          <button class="start-btn" :disabled="scanning || !localRoot" @click="runScan">
            {{ scanning ? t("onboarding.scanning") : t("onboarding.scanWorkspace") }}
          </button>
          <button
            class="btn-secondary"
            :disabled="preconfigurating || !localRoot"
            @click="runAiPreconfigure"
          >
            {{
              preconfigurating
                ? t("onboarding.analyzing")
                : t("onboarding.preconfigure")
            }}
          </button>
        </div>
        <div class="wiz-hint" style="margin-top: 8px">
          {{ t("onboarding.preconfigureHint") }}
        </div>
        <div v-if="scanError" class="wiz-error">{{ scanError }}</div>
      </div>

      <!-- Step 2: Review & Apply -->
      <div v-if="step === 2" class="wizard-body">
        <div v-if="scanResult" class="wiz-info-row">
          <span class="wiz-label">{{ t("onboarding.detected") }}</span>
          <code>{{ scanResult.detected_stack.join(", ") || "unknown" }}</code>
          <span class="wiz-label" style="margin-left: 16px">{{
            t("onboarding.mode")
          }}</span>
          <code>{{ scanResult.suggested_context_mode }}</code>
        </div>

        <div class="wiz-section-title">{{ t("onboarding.contextPreview") }}</div>
        <textarea
          class="wiz-preview"
          rows="6"
          :value="contextPreview"
          @input="contextPreview = ($event.target as HTMLTextAreaElement).value"
        />

        <div v-if="mcpServers.length > 0">
          <div class="wiz-section-title">{{ t("onboarding.recommendedServers") }}</div>
          <div class="mcp-list">
            <label v-for="srv in mcpServers" :key="srv.name" class="mcp-item">
              <input v-model="srv.enabled" type="checkbox" />
              <span class="mcp-name">{{ srv.name }}</span>
              <code class="mcp-transport">{{ srv.transport }}</code>
              <code class="mcp-cmd">{{ srv.command }} {{ srv.args.join(" ") }}</code>
              <span class="mcp-reason">{{ srv.reason }}</span>
            </label>
          </div>
        </div>

        <div v-if="modelAssignments.length > 0">
          <div class="wiz-section-title">{{ t("onboarding.modelAssignments") }}</div>
          <div class="model-assignments-table">
            <div
              v-for="a in modelAssignments"
              :key="a.role"
              class="model-assignment-row"
            >
              <span class="ma-role">{{ a.role }}</span>
              <span class="ma-arrow">→</span>
              <code class="ma-model">{{ a.model_id }}</code>
              <span class="ma-provider">({{ a.provider }})</span>
            </div>
          </div>
        </div>

        <div class="wizard-actions">
          <button class="btn-secondary" @click="step = 1">
            {{ t("dialogs.cancel") }}
          </button>
          <button class="start-btn" :disabled="applying" @click="applyConfig(false)">
            {{ applying ? t("onboarding.applying") : t("onboarding.applyContext") }}
          </button>
          <button
            v-if="mcpServers.length > 0"
            class="start-btn"
            :disabled="applying"
            style="background: var(--accent-hi)"
            @click="applyConfig(true)"
          >
            {{ applying ? t("onboarding.applying") : t("onboarding.applyMcpContext") }}
          </button>
        </div>
        <div v-if="applyError" class="wiz-error">{{ applyError }}</div>
      </div>

      <!-- Step 3: Done + Preflight -->
      <div v-if="step === 3" class="wizard-body">
        <div class="wiz-success">{{ t("onboarding.appliedTitle") }}</div>

        <div v-if="Object.keys(mcpPreflight).length > 0">
          <div class="wiz-section-title">{{ t("onboarding.preflight") }}</div>
          <div class="mcp-preflight-list">
            <div
              v-for="(info, name) in mcpPreflight"
              :key="name"
              class="mcp-preflight-item"
              :class="info.status"
            >
              <span class="pflight-icon">
                {{ info.status === "ok" ? "✓" : info.status === "failed" ? "✗" : "○" }}
              </span>
              <span class="pflight-name">{{ name }}</span>
              <span v-if="info.status === 'pending'" class="pflight-status">{{
                t("onboarding.checking")
              }}</span>
              <span v-else-if="info.status === 'ok'" class="pflight-status ok">
                {{ t("onboarding.ok") }} ({{ info.latency }}ms) — {{ info.tool_count }}
                {{ t("onboarding.toolsAvailable") }}
              </span>
              <span v-else class="pflight-status error">{{
                info.error ?? t("onboarding.failed")
              }}</span>
            </div>
          </div>
        </div>

        <div v-if="recommendedCapabilities.length > 0">
          <div class="wiz-section-title">
            {{ t("onboarding.recommendedCapabilities") }}
          </div>
          <div class="mcp-preflight-list">
            <div
              v-for="capability in recommendedCapabilities"
              :key="capability.name"
              class="mcp-preflight-item"
              :class="capability.available ? 'ok' : 'pending'"
            >
              <span class="pflight-icon">{{ capability.available ? "✓" : "○" }}</span>
              <span class="pflight-name">{{ capability.name }}</span>
              <span class="pflight-status" :class="capability.available ? 'ok' : ''">
                {{
                  capability.available
                    ? t("onboarding.available")
                    : t("onboarding.recommended")
                }}
                —
                {{ capability.reason }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="recommendedServers.length > 0">
          <div class="wiz-section-title">{{ t("onboarding.recommendedServers") }}</div>
          <div class="mcp-preflight-list">
            <div
              v-for="server in recommendedServers"
              :key="server.name"
              class="mcp-preflight-item"
              :class="server.enabled ? 'ok' : 'pending'"
            >
              <span class="pflight-icon">{{ server.enabled ? "✓" : "○" }}</span>
              <span class="pflight-name">{{ server.name }}</span>
              <span class="pflight-status" :class="server.enabled ? 'ok' : ''">
                {{
                  server.enabled
                    ? t("onboarding.configured")
                    : t("onboarding.recommended")
                }}
                —
                {{ server.reason }}
              </span>
            </div>
          </div>
        </div>

        <div class="wizard-actions">
          <button class="start-btn" @click="isCollapsed = true">
            {{ t("onboarding.done") }}
          </button>
          <button class="btn-secondary" @click="reRunPreconfigure">
            {{ t("onboarding.rerun") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelAssignment } from "@/features/onboarding/onboarding-types";
import { useOnboardingWizard } from "./useOnboardingWizard";
import { useI18n } from "@/shared/lib/i18n";

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

/* Collapsed bar */
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

/* Expanded panel */
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
.wizard-body {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Fields */
.wizard-field-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.wiz-label {
  font-size: 11px;
  color: var(--text2);
  white-space: nowrap;
  min-width: 70px;
}
.wiz-input {
  flex: 1;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 12px;
  padding: 5px 10px;
  font-family: var(--mono);
}
.wiz-input:focus {
  outline: none;
  border-color: var(--border-focus);
}

/* Actions row */
.wizard-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* Info row */
.wiz-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

/* Section title */
.wiz-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

/* Preview textarea */
.wiz-preview {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 12px;
  font-family: var(--mono);
  padding: 8px 10px;
  resize: vertical;
}
.wiz-preview:focus {
  outline: none;
  border-color: var(--border-focus);
}

/* MCP list */
.mcp-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 10px;
}
.mcp-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  cursor: pointer;
  flex-wrap: wrap;
}
.mcp-item input[type="checkbox"] {
  margin-top: 2px;
  flex-shrink: 0;
}
.mcp-name {
  font-weight: 600;
  min-width: 80px;
}
.mcp-transport {
  color: var(--text2);
  font-size: 11px;
}
.mcp-cmd {
  color: var(--accent);
  font-size: 11px;
}
.mcp-reason {
  color: var(--text2);
  font-size: 11px;
  flex-basis: 100%;
  padding-left: 20px;
}

/* Preflight list */
.mcp-preflight-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 10px;
}
.mcp-preflight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.pflight-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
}
.mcp-preflight-item.ok .pflight-icon {
  color: var(--success);
}
.mcp-preflight-item.failed .pflight-icon {
  color: var(--error);
}
.mcp-preflight-item.pending .pflight-icon {
  color: var(--text2);
}
.pflight-name {
  min-width: 90px;
  font-weight: 600;
}
.pflight-status {
  color: var(--text2);
  font-size: 11px;
}
.pflight-status.ok {
  color: var(--success);
}
.pflight-status.error {
  color: var(--error);
}

/* Model assignments */
.model-assignments-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 10px;
  font-size: 12px;
  font-family: var(--mono);
}
.model-assignment-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ma-role {
  min-width: 72px;
  font-weight: 600;
  color: var(--text2);
}
.ma-arrow {
  color: var(--text2);
}
.ma-model {
  color: var(--accent);
}
.ma-provider {
  color: var(--text2);
  font-size: 11px;
}

/* Feedback messages */
.wiz-success {
  color: var(--success);
  font-weight: 600;
  font-size: 13px;
}
.wiz-error {
  color: var(--error);
  font-size: 12px;
  padding: 6px 10px;
  background: rgba(244, 91, 91, 0.08);
  border: 1px solid rgba(244, 91, 91, 0.25);
  border-radius: var(--radius);
}
.wiz-hint {
  color: var(--text2);
  font-size: 11px;
}
</style>
