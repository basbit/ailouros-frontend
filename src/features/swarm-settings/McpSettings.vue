<template>
  <div class="mcp-settings-fields">
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_mcp_auto"
          type="checkbox"
          :checked="form.swarm_mcp_auto"
          @change="
            emit(
              'update:form',
              'swarm_mcp_auto',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("mcp.autoLabel") }}</span>
      </label>
    </div>
    <div class="hint" style="margin-bottom: 8px">
      {{ t("mcp.autoHint") }} <code>swarm.mcp_auto: false</code> ({{
        t("mcp.overrides")
      }}
      <code>SWARM_MCP_AUTO</code>).
    </div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_skip_mcp_tools"
          type="checkbox"
          :checked="form.swarm_skip_mcp_tools"
          @change="
            emit(
              'update:form',
              'swarm_skip_mcp_tools',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("mcp.skipLabel") }}</span>
      </label>
    </div>
    <div class="field">
      <label class="field-label" for="mcp_servers_json">{{
        t("mcp.customLabel")
      }}</label>
      <textarea
        id="mcp_servers_json"
        rows="5"
        :value="form.mcp_servers_json"
        placeholder='{"servers":[...]} or {"mcpServers":{"id":{"command":"npx","args":["-y","pkg"]}}}'
        @input="
          emit(
            'update:form',
            'mcp_servers_json',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
      ></textarea>
      <div class="hint">{{ t("mcp.customHint") }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

interface McpFormSlice {
  swarm_mcp_auto: boolean;
  swarm_skip_mcp_tools: boolean;
  mcp_servers_json: string;
}

defineProps<{ form: McpFormSlice }>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
const { t } = useI18n();
</script>
