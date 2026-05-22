<template>
  <div class="run-idle">
    <AppHeaderContainer />

    <div class="run-idle__layout">
      <main class="run-idle__main">
        <div class="run-idle__compose">
          <header class="run-idle__intro">
            <h1 class="run-idle__title">{{ t("runIdle.heading") }}</h1>
            <p class="run-idle__subtitle">{{ t("runIdle.subheading") }}</p>
          </header>

          <section class="run-idle__prompt-card">
            <PromptInput
              v-model="settings.form.prompt"
              :workspace-root="settings.form.workspace_root"
              :rows="5"
            />
            <div class="run-idle__prompt-actions">
              <ScenarioQuickLaunch
                :model-value="settings.form.scenario_id"
                :favorites="settings.form.favorite_scenarios"
                :custom-scenarios="settings.form.custom_scenarios"
                @update:model-value="handlers.onScenarioPick"
              />
              <button
                type="button"
                class="run-idle__library-link"
                @click="handlers.onOpenScenarioLibrary"
              >
                {{ t("runIdle.openLibrary") }}
              </button>
              <div class="run-idle__spacer" />
              <button
                type="button"
                class="run-idle__run-btn"
                :disabled="header.isRunning.value || !canRun || isStarting"
                @click="handlers.onStart"
              >
                {{ t("runIdle.runButton") }}
              </button>
            </div>
          </section>

          <section
            v-if="activeGateBanner"
            class="run-idle__gate-banner"
            role="alert"
            @click="handlers.onOpenActiveRun"
          >
            <div class="run-idle__gate-banner-head">
              <span class="run-idle__gate-banner-status">
                {{ t("runIdle.gateBanner.status", { status: ui.taskStatus }) }}
              </span>
              <button
                type="button"
                class="run-idle__gate-banner-open"
                @click.stop="handlers.onOpenActiveRun"
              >
                {{ t("runIdle.gateBanner.openRun") }} →
              </button>
            </div>
            <p v-if="latestLogMessage" class="run-idle__gate-banner-message">
              {{ latestLogMessage }}
            </p>
          </section>

          <PipelineSpine
            :steps="pipelineSteps"
            @open-configure="handlers.onOpenConfigure"
          />

          <PatternMemoryHint
            v-if="patternHint"
            :message="patternHintMessage"
            @apply="handlers.onApplyPatternHint"
            @dismiss="handlers.onDismissPatternHint"
          />
        </div>
      </main>

      <HistoryGlimpse
        :items="historyItems"
        @select="handlers.onSelectHistoryRun"
        @open-all="handlers.onOpenHistory"
      />
    </div>

    <ScenarioPickerDialog
      :open="scenarioPickerOpen"
      :model-value="settings.form.scenario_id"
      :favorites="settings.form.favorite_scenarios"
      :custom-scenarios="settings.form.custom_scenarios"
      @update:open="scenarioPickerOpen = $event"
      @update:model-value="handlers.onScenarioPick"
      @toggle-favorite="handlers.onScenarioFavoriteToggle"
      @open-settings="handlers.onOpenScenarioSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { inject } from "vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PromptInput from "@/features/prompt-input/PromptInput.vue";
import ScenarioQuickLaunch from "@/features/scenario-picker/ScenarioQuickLaunch.vue";
import ScenarioPickerDialog from "@/features/scenario-picker/ScenarioPickerDialog.vue";
import PipelineSpine from "@/widgets/run-idle/PipelineSpine.vue";
import HistoryGlimpse from "@/widgets/run-idle/HistoryGlimpse.vue";
import PatternMemoryHint from "@/widgets/pattern-memory-hint/PatternMemoryHint.vue";
import { APP_SETTINGS_KEY } from "@/app/providers/settingsContext";
import { SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run/swarmRunContext";
import { useRunIdleHandlers } from "./useRunIdleHandlers";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

const injectedSettings = inject(APP_SETTINGS_KEY);
const injectedController = inject(SWARM_RUN_CONTROLLER_KEY);
if (!injectedSettings || !injectedController) {
  throw new Error("RunIdlePage requires APP_SETTINGS_KEY and SWARM_RUN_CONTROLLER_KEY");
}
const settings = injectedSettings;

const handlers = useRunIdleHandlers(settings, injectedController);
const {
  ui,
  header,
  pipelineSteps,
  canRun,
  isStarting,
  activeGateBanner,
  latestLogMessage,
  scenarioPickerOpen,
  patternHint,
  patternHintMessage,
  historyItems,
} = handlers;
</script>

<style scoped>
.run-idle {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
  color: var(--ink);
}

.run-idle__layout {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 1fr 320px;
  min-height: 0;
  overflow: hidden;
}

.run-idle__main {
  overflow-y: auto;
  padding: 40px 60px 28px;
}

.run-idle__compose {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 760px;
  margin: 0 auto;
}

.run-idle__intro {
  text-align: center;
}

.run-idle__title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 6px;
}

.run-idle__subtitle {
  font-size: 13px;
  color: var(--ink-3);
  margin: 0;
}

.run-idle__prompt-card {
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-xl);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-md);
}

.run-idle__prompt-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.run-idle__spacer {
  flex: 1 1 auto;
}

.run-idle__library-link {
  appearance: none;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 11px;
  color: var(--ink-3);
  cursor: pointer;
}

.run-idle__library-link:hover {
  border-color: var(--line-strong);
  color: var(--ink-2);
}

.run-idle__run-btn {
  appearance: none;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: var(--r-md);
  background: linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%);
  color: #fff;
  cursor: pointer;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 6px 14px -4px var(--accent-glow);
  transition: filter 0.15s;
}

.run-idle__run-btn:hover:not(:disabled) {
  filter: brightness(1.05);
}
.run-idle__run-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .run-idle__layout {
    grid-template-columns: 1fr;
  }
  .run-idle__main {
    padding: 28px 24px 24px;
  }
}

.run-idle__gate-banner {
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid var(--warn, #c98a1a);
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--warn, #c98a1a) 12%, transparent);
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
}

.run-idle__gate-banner:hover {
  filter: brightness(1.05);
}

.run-idle__gate-banner-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.run-idle__gate-banner-status {
  font-size: 12px;
  font-weight: 600;
  color: var(--warn, #c98a1a);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.run-idle__gate-banner-open {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--accent, #1f5fcf);
  font-size: 12px;
  cursor: pointer;
  font-weight: 500;
}

.run-idle__gate-banner-message {
  margin: 0;
  font-size: 13px;
  color: var(--ink);
  line-height: 1.4;
  white-space: pre-wrap;
}
</style>
