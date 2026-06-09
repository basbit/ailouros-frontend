<template>
  <section class="status-snapshot" :aria-label="t('orchestrationStatus.cardAria')">
    <header class="status-snapshot__header">
      <h3 class="status-snapshot__title">
        {{ t("orchestrationStatus.headline") }}
      </h3>
      <button
        type="button"
        class="status-snapshot__refresh"
        :disabled="status.loading.value || !canRefresh"
        @click="onRefresh"
      >
        {{
          status.loading.value
            ? t("orchestrationStatus.refreshing")
            : t("orchestrationStatus.refresh")
        }}
      </button>
    </header>

    <p v-if="status.lastError.value" class="status-snapshot__error">
      {{ status.lastError.value }}
    </p>

    <div v-if="snapshot" class="status-snapshot__blocks">
      <div class="status-snapshot__block">
        <h4 class="status-snapshot__block-title">
          {{ t("orchestrationStatus.phase") }}
        </h4>
        <dl class="status-snapshot__rows">
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.currentPhase") }}</dt>
            <dd>{{ snapshot.phase.currentPhase || "—" }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.autoAdvance") }}</dt>
            <dd>{{ snapshot.phase.autoAdvanceAllowed ? "✓" : "—" }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.terminal") }}</dt>
            <dd>{{ snapshot.phase.isTerminal ? "✓" : "—" }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.historySteps") }}</dt>
            <dd>{{ snapshot.phase.historySteps }}</dd>
          </div>
        </dl>
      </div>

      <div class="status-snapshot__block">
        <h4 class="status-snapshot__block-title">
          {{ t("orchestrationStatus.hierarchy") }}
        </h4>
        <dl class="status-snapshot__rows">
          <div v-if="snapshot.hierarchy.milestoneId" class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.milestone") }}</dt>
            <dd>
              {{ snapshot.hierarchy.milestoneTitle }}
              <code>{{ snapshot.hierarchy.milestoneId }}</code>
            </dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.plans") }}</dt>
            <dd>{{ snapshot.hierarchy.planCount }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.waves") }}</dt>
            <dd>{{ snapshot.hierarchy.waveCount }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.tasks") }}</dt>
            <dd>
              {{ snapshot.hierarchy.taskCount }}
              <small>
                ({{
                  t("orchestrationStatus.taskBreakdown", {
                    pending: snapshot.hierarchy.pendingTasks,
                    completed: snapshot.hierarchy.completedTasks,
                    blocked: snapshot.hierarchy.blockedTasks,
                  })
                }})
              </small>
            </dd>
          </div>
        </dl>
      </div>

      <div class="status-snapshot__block">
        <h4 class="status-snapshot__block-title">
          {{ t("orchestrationStatus.artefacts") }}
        </h4>
        <dl class="status-snapshot__rows">
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.scenario") }}</dt>
            <dd>{{ snapshot.artefacts.scenario }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.complete") }}</dt>
            <dd>{{ snapshot.artefacts.isComplete ? "✓" : "—" }}</dd>
          </div>
          <div
            v-if="snapshot.artefacts.missing.length > 0"
            class="status-snapshot__row"
          >
            <dt>{{ t("orchestrationStatus.missing") }}</dt>
            <dd>{{ snapshot.artefacts.missing.join(", ") }}</dd>
          </div>
          <div v-if="snapshot.artefacts.empty.length > 0" class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.empty") }}</dt>
            <dd>{{ snapshot.artefacts.empty.join(", ") }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="snapshot.lint.enabled" class="status-snapshot__block">
        <h4 class="status-snapshot__block-title">
          {{ t("orchestrationStatus.lint") }}
        </h4>
        <dl class="status-snapshot__rows">
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.lintErrors") }}</dt>
            <dd>{{ snapshot.lint.errorCount }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.lintWarnings") }}</dt>
            <dd>{{ snapshot.lint.warningCount }}</dd>
          </div>
          <div class="status-snapshot__row">
            <dt>{{ t("orchestrationStatus.lintBlocking") }}</dt>
            <dd>{{ snapshot.lint.blockingCount }}</dd>
          </div>
        </dl>
      </div>

      <ul v-if="snapshot.notes.length > 0" class="status-snapshot__notes">
        <li v-for="note in snapshot.notes" :key="note" class="status-snapshot__note">
          {{ note }}
        </li>
      </ul>
    </div>

    <p v-else class="status-snapshot__hint">
      {{ t("orchestrationStatus.hint") }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useI18n } from "@/shared/lib/i18n";
import { useOrchestrationStatus } from "@/features/orchestration-status/useOrchestrationStatus";

const props = defineProps<{ scenario: string; workspaceRoot?: string | null }>();

const { t } = useI18n();
const status = useOrchestrationStatus();
const snapshot = computed(() => status.snapshot.value);

const canRefresh = computed(() => Boolean(props.scenario.trim()));

async function onRefresh(): Promise<void> {
  if (!canRefresh.value) return;
  await status.refresh({
    scenario: props.scenario,
    workspaceRoot: props.workspaceRoot ?? null,
  });
}
</script>

<style scoped>
.status-snapshot {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-snapshot__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-snapshot__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
  flex: 1 1 auto;
}

.status-snapshot__refresh {
  appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  color: var(--ink);
  cursor: pointer;
}

.status-snapshot__refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.status-snapshot__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.status-snapshot__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  font-style: italic;
}

.status-snapshot__blocks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-snapshot__block {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 8px 10px;
  background: var(--bg-elev);
}

.status-snapshot__block-title {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.status-snapshot__rows {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.status-snapshot__row {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.status-snapshot__row dt {
  color: var(--ink-3);
  min-width: 110px;
}

.status-snapshot__row dd {
  margin: 0;
  color: var(--ink);
}

.status-snapshot__row dd small {
  color: var(--ink-4);
}

.status-snapshot__row dd code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.status-snapshot__notes {
  list-style: disc;
  padding-left: 18px;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-snapshot__note {
  font-size: 12px;
  color: var(--ink-2);
}
</style>
