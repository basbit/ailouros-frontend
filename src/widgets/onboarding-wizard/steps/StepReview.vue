<template>
  <div class="wizard-body">
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
      @input="
        emit('update:contextPreview', ($event.target as HTMLTextAreaElement).value)
      "
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
        <div v-for="a in modelAssignments" :key="a.role" class="model-assignment-row">
          <span class="ma-role">{{ a.role }}</span>
          <span class="ma-arrow">→</span>
          <code class="ma-model">{{ a.model_id }}</code>
          <span class="ma-provider">({{ a.provider }})</span>
        </div>
      </div>
    </div>

    <div class="wizard-actions">
      <button class="btn-secondary" @click="emit('cancel')">
        {{ t("dialogs.cancel") }}
      </button>
      <button class="start-btn" :disabled="applying" @click="emit('apply', false)">
        {{ applying ? t("onboarding.applying") : t("onboarding.applyContext") }}
      </button>
      <button
        v-if="mcpServers.length > 0"
        class="start-btn"
        :disabled="applying"
        style="background: var(--accent-hi)"
        @click="emit('apply', true)"
      >
        {{ applying ? t("onboarding.applying") : t("onboarding.applyMcpContext") }}
      </button>
    </div>
    <div v-if="applyError" class="wiz-error">{{ applyError }}</div>
  </div>
</template>

<script setup lang="ts">
import type {
  ModelAssignment,
  ScanResult,
  MCPServerSpec,
} from "@/shared/model/onboarding-types";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  scanResult: ScanResult | null;
  contextPreview: string;
  mcpServers: MCPServerSpec[];
  modelAssignments: ModelAssignment[];
  applying: boolean;
  applyError: string | null;
}>();

const emit = defineEmits<{
  "update:contextPreview": [val: string];
  cancel: [];
  apply: [withMcp: boolean];
}>();

const { t } = useI18n();
</script>

<style src="./wizard-shared.css"></style>
