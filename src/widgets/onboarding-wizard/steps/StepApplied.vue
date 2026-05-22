<template>
  <div class="wizard-body">
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
              server.enabled ? t("onboarding.configured") : t("onboarding.recommended")
            }}
            —
            {{ server.reason }}
          </span>
        </div>
      </div>
    </div>

    <div class="wizard-actions">
      <button class="start-btn" @click="emit('done')">
        {{ t("onboarding.done") }}
      </button>
      <button class="btn-secondary" @click="emit('rerun')">
        {{ t("onboarding.rerun") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  PreflightInfo,
  PreflightRecommendation,
} from "@/shared/model/onboarding-types";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  mcpPreflight: Record<string, PreflightInfo>;
  recommendedCapabilities: PreflightRecommendation[];
  recommendedServers: PreflightRecommendation[];
}>();

const emit = defineEmits<{
  done: [];
  rerun: [];
}>();

const { t } = useI18n();
</script>

<style src="./wizard-shared.css"></style>
