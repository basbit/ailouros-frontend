<template>
  <div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_background_agent"
          type="checkbox"
          :checked="enabled"
          @change="
            emit(
              'update:form',
              'swarm_background_agent',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.backgroundAgentLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.backgroundAgentHint") }}
        <em>{{ t("auto.experimentalHint") }}</em>
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="swarm_background_watch_paths">{{
        t("auto.watchPathsLabel")
      }}</label>
      <div class="watch-paths-row">
        <input
          id="swarm_background_watch_paths"
          type="text"
          placeholder="src,tests"
          :value="watchPaths"
          @input="
            emit(
              'update:form',
              'swarm_background_watch_paths',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
        <button
          type="button"
          class="watch-paths-row__add"
          :title="t('filePicker.appendPath')"
          @click="onAppendPath"
        >
          {{ t("filePicker.appendPath") }}
        </button>
        <input
          v-if="!isDesktopShell"
          ref="browserInputRef"
          type="file"
          class="watch-paths-row__hidden-input"
          webkitdirectory
          @change="onBrowserDirectorySelected"
        />
      </div>
      <div class="hint">
        {{ t("auto.watchPathsHint") }}
        <code>SWARM_BACKGROUND_AGENT_WATCH_PATHS</code>
      </div>
    </div>
    <AutonomousModelPickerField
      v-if="enabled"
      :label="t('auto.backgroundAgentModelLabel')"
      :provider="provider"
      :model-value="model"
      :connection="connection"
      :custom-placeholder="t('auto.modelIdPlaceholder')"
      env-code="SWARM_BACKGROUND_AGENT_MODEL"
      @update:provider="emit('update:form', 'swarm_background_agent_provider', $event)"
      @update:model-value="emit('update:form', 'swarm_background_agent_model', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AutonomousModelPickerField from "./AutonomousModelPickerField.vue";
import { useI18n } from "@/shared/lib/i18n";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import { frontendLogger } from "@/shared/lib/frontend-logger";

interface CloudConnection {
  remote_api_provider: string;
  remote_api_key: string;
  remote_api_base_url: string;
}

const props = defineProps<{
  enabled: boolean;
  watchPaths: string;
  model: string;
  provider: string;
  connection: CloudConnection;
}>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
const { t } = useI18n();
const isDesktopShell = isDesktop();
const browserInputRef = ref<HTMLInputElement | null>(null);

function appendPathToWatchPaths(path: string): void {
  const cleaned = path.trim();
  if (!cleaned) return;
  const existing = (props.watchPaths || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (existing.includes(cleaned)) return;
  existing.push(cleaned);
  emit("update:form", "swarm_background_watch_paths", existing.join(","));
}

async function onAppendPath(): Promise<void> {
  if (isDesktopShell) {
    try {
      const dialog = await import("@tauri-apps/plugin-dialog");
      const selected = await dialog.open({
        directory: true,
        multiple: false,
        title: t("filePicker.pickDirectory"),
      });
      if (typeof selected !== "string" || !selected) return;
      appendPathToWatchPaths(selected);
    } catch (error) {
      frontendLogger.warn("watch-paths picker failed", error);
    }
    return;
  }
  browserInputRef.value?.click();
}

function onBrowserDirectorySelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  const folderName =
    relative && relative.includes("/") ? relative.split("/")[0] : relative || file.name;
  appendPathToWatchPaths(folderName);
  input.value = "";
}
</script>

<style scoped>
.watch-paths-row {
  display: flex;
  gap: 6px;
  align-items: stretch;
}
.watch-paths-row input[type="text"] {
  flex: 1;
  min-width: 0;
}
.watch-paths-row__add {
  background: var(--surface2, #1e2230);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #9dadd0);
  padding: 0 10px;
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
}
.watch-paths-row__hidden-input {
  display: none;
}
</style>
