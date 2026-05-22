<template>
  <section class="mcp-pane">
    <PaneHeader
      :title="t('configure.mcp.title')"
      :subtitle="t('configure.mcp.subtitle')"
    />
    <p class="mcp-pane__banner">{{ t("configure.apiKeysBanner") }}</p>
    <McpSettings :form="mcpForm" @update:form="onMcpFormUpdate" />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import McpSettings from "@/features/project-settings/McpSettings.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();

const mcpForm = computed(() => ({
  swarm_mcp_auto: settings.form.swarm_mcp_auto,
  swarm_skip_mcp_tools: settings.form.swarm_skip_mcp_tools,
  mcp_servers_json: settings.form.mcp_servers_json,
}));

function onMcpFormUpdate(field: string, value: string): void {
  if (field === "swarm_mcp_auto" || field === "swarm_skip_mcp_tools") {
    settings.form[field] = value === "true";
  } else if (field === "mcp_servers_json") {
    settings.form.mcp_servers_json = value;
  }
  settings.saveSettingsSoon();
}
</script>

<style scoped>
.mcp-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}

.mcp-pane__banner {
  margin: 0;
  padding: 10px 14px;
  background: var(--accent-soft);
  color: var(--accent-2);
  border-radius: var(--r-md);
  font-size: 12px;
}
</style>
