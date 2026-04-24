<template>
  <details class="section">
    <summary>{{ t("workspace.summary") }}</summary>
    <div class="section-body">
      <div class="hint" style="margin-bottom: 9px">
        {{ t("workspace.pathHint") }}
        <code>workspace_root</code> + optional <code>project_context_file</code>.
      </div>
      <div class="field">
        <label class="field-label" for="workspace_root">workspace_root</label>
        <input
          id="workspace_root"
          type="text"
          placeholder="/absolute/path/to/repo"
          :value="workspaceRoot"
          @input="
            emit('update:workspaceRoot', ($event.target as HTMLInputElement).value)
          "
        />
      </div>
      <div class="field">
        <label class="field-label" for="project_context_file">
          project_context_file
          <span style="opacity: 0.6; font-weight: 400"
            >({{ t("workspace.optional") }})</span
          >
        </label>
        <input
          id="project_context_file"
          type="text"
          placeholder="docs/PROJECT_CONTEXT.md"
          :value="projectContextFile"
          @input="
            emit('update:projectContextFile', ($event.target as HTMLInputElement).value)
          "
        />
      </div>
      <div class="field">
        <label class="checkbox-row">
          <input
            id="workspace_write"
            type="checkbox"
            :checked="workspaceWrite"
            @change="
              emit('update:workspaceWrite', ($event.target as HTMLInputElement).checked)
            "
          />
          <span class="check-label">
            {{ t("workspace.writePrefix") }} <code>&lt;swarm_file&gt;</code> /
            <code>&lt;swarm_patch&gt;</code> {{ t("workspace.writeMiddle") }}
            <code>SWARM_ALLOW_WORKSPACE_WRITE=1</code>. {{ t("workspace.writeShell") }}
            <code>SWARM_ALLOW_COMMAND_EXEC=1</code>
          </span>
        </label>
      </div>
      <div
        v-if="capabilities"
        class="hint"
        :style="
          capsError
            ? 'margin-top:8px;font-size:11px;color:var(--error)'
            : 'margin-top:8px;font-size:11px'
        "
      >
        {{ t("workspace.serverLabel") }}
        {{
          capabilities.workspace_write
            ? t("workspace.allowed")
            : t("workspace.forbidden")
        }}
        · {{ t("workspace.shellLabel") }} &lt;swarm_shell&gt;
        {{
          capabilities.command_exec ? t("workspace.allowed") : t("workspace.forbidden")
        }}.
        <template v-if="!capabilities.workspace_write">
          {{ t("workspace.filesHint") }} <code>SWARM_ALLOW_WORKSPACE_WRITE=1</code>.
        </template>
        <template v-if="!capabilities.command_exec">
          {{ t("workspace.commandsHint") }} <code>SWARM_ALLOW_COMMAND_EXEC=1</code>.
        </template>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  workspaceRoot: string;
  projectContextFile: string;
  workspaceWrite: boolean;
  capabilities: { workspace_write?: boolean; command_exec?: boolean } | null;
}>();

const emit = defineEmits<{
  "update:workspaceRoot": [val: string];
  "update:projectContextFile": [val: string];
  "update:workspaceWrite": [val: boolean];
}>();
const { t } = useI18n();

const capsError = computed(
  () =>
    !!(
      props.capabilities &&
      !props.capabilities.workspace_write &&
      props.workspaceWrite
    ),
);
</script>
