<template>
  <ul class="first-run-stages">
    <li
      v-for="entry in stages"
      :key="entry.stage"
      class="first-run-stage"
      :class="`first-run-stage--${entry.state}`"
    >
      <div class="first-run-stage__head">
        <span class="first-run-stage__icon" aria-hidden="true">{{
          stageIcon(entry.state)
        }}</span>
        <span class="first-run-stage__label">{{ t(stageLabelKey(entry.stage)) }}</span>
        <span class="first-run-stage__state">{{ t(stageStateKey(entry.state)) }}</span>
      </div>
      <progress
        v-if="entry.state === 'active'"
        :value="entry.fraction"
        max="1"
        class="first-run-stage__progress"
      />
      <p v-if="entry.message" class="first-run-stage__message">
        {{ entry.message }}
      </p>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import type { BootstrapStage, StageRuntimeState, StageRuntimeView } from "./types";

defineProps<{
  stages: StageRuntimeView[];
}>();

const { t } = useI18n();

const stageLabelMap: Record<BootstrapStage, string> = {
  "preparing-tree": "firstRun.stage.preparingTree",
  "fetching-python": "firstRun.stage.fetchingPython",
  "creating-venv": "firstRun.stage.creatingVenv",
  "installing-backend": "firstRun.stage.installingBackend",
  "staging-llama-cpp": "firstRun.stage.stagingLlamaCpp",
  "staging-mcp-runtimes": "firstRun.stage.stagingMcpRuntimes",
  "downloading-model": "firstRun.stage.downloadingModel",
  "waiting-for-backend": "firstRun.stage.waitingForBackend",
  failed: "firstRun.stage.failed",
  ready: "firstRun.stage.ready",
};

function stageLabelKey(stage: BootstrapStage): string {
  return stageLabelMap[stage];
}

function stageStateKey(stateName: StageRuntimeState): string {
  return `firstRun.state.${stateName}`;
}

function stageIcon(stateName: StageRuntimeState): string {
  switch (stateName) {
    case "done":
      return "✓";
    case "skipped":
      return "→";
    case "active":
      return "…";
    case "error":
      return "!";
    default:
      return "·";
  }
}
</script>

<style scoped>
.first-run-stages {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.first-run-stage {
  border: 1px solid var(--border-subtle, #e0e0e0);
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
}
.first-run-stage__head {
  display: grid;
  grid-template-columns: 1.25rem 1fr auto;
  gap: 0.5rem;
  align-items: center;
}
.first-run-stage__icon {
  font-weight: 600;
  text-align: center;
}
.first-run-stage__label {
  font-weight: 500;
}
.first-run-stage__state {
  font-size: 0.8rem;
  color: var(--text-muted, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.first-run-stage--done .first-run-stage__icon {
  color: #166534;
}
.first-run-stage--skipped .first-run-stage__icon {
  color: #b45309;
}
.first-run-stage--active .first-run-stage__icon {
  color: #1d4ed8;
}
.first-run-stage--error .first-run-stage__icon {
  color: #b91c1c;
}
.first-run-stage__progress {
  width: 100%;
  height: 4px;
  margin-top: 0.4rem;
}
.first-run-stage__message {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted, #666);
}
</style>
