<template>
  <div class="run-diagnostics__body">
    <section v-if="diagnostics.phaseLoop" class="run-diagnostics__group">
      <h4 class="run-diagnostics__subtitle">
        {{ t("runDiagnostics.phaseLoop") }}
      </h4>
      <p class="run-diagnostics__meta">
        {{
          t("runDiagnostics.phaseSummary", {
            scenario: diagnostics.phaseLoop.scenario,
            phase: diagnostics.phaseLoop.currentPhase,
          })
        }}
      </p>
      <ul v-if="diagnostics.phaseLoop.history.length > 0" class="run-diagnostics__list">
        <li
          v-for="(entry, index) in diagnostics.phaseLoop.history"
          :key="`${entry.from}-${entry.to}-${index}`"
          class="run-diagnostics__row"
        >
          <code class="run-diagnostics__code">{{ entry.from }} → {{ entry.to }}</code>
          <span class="run-diagnostics__reason">{{ entry.reason }}</span>
        </li>
      </ul>
    </section>

    <section v-if="diagnostics.wikiContextTier" class="run-diagnostics__group">
      <h4 class="run-diagnostics__subtitle">{{ t("runDiagnostics.memoryTier") }}</h4>
      <p class="run-diagnostics__meta">
        <span class="run-diagnostics__pill">{{
          diagnostics.wikiContextTier.tier
        }}</span>
        <span class="run-diagnostics__reason">{{
          diagnostics.wikiContextTier.reason
        }}</span>
      </p>
    </section>

    <section v-if="diagnostics.entailmentVerdict" class="run-diagnostics__group">
      <h4 class="run-diagnostics__subtitle">{{ t("runDiagnostics.entailment") }}</h4>
      <p class="run-diagnostics__meta">
        <span
          class="run-diagnostics__pill"
          :class="`run-diagnostics__pill--${diagnostics.entailmentVerdict.verdict}`"
        >
          {{ diagnostics.entailmentVerdict.verdict }}
        </span>
        <span class="run-diagnostics__reason">
          {{
            t("runDiagnostics.entailmentScore", {
              score: diagnostics.entailmentVerdict.score.toFixed(2),
            })
          }}
        </span>
      </p>
      <p v-if="diagnostics.entailmentVerdict.reason" class="run-diagnostics__reason">
        {{ diagnostics.entailmentVerdict.reason }}
      </p>
    </section>

    <section v-if="diagnostics.citation" class="run-diagnostics__group">
      <h4 class="run-diagnostics__subtitle">{{ t("runDiagnostics.citation") }}</h4>
      <ul class="run-diagnostics__list">
        <li
          v-for="(item, index) in diagnostics.citation.nodes"
          :key="`${item.node}-${index}`"
          class="run-diagnostics__row"
        >
          <code class="run-diagnostics__code">{{ item.node }}</code>
          <span
            class="run-diagnostics__pill"
            :class="
              item.data.accepted
                ? 'run-diagnostics__pill--accept'
                : 'run-diagnostics__pill--reject'
            "
          >
            {{ item.data.mode }} · {{ item.data.accepted ? "ok" : "blocked" }}
          </span>
          <span class="run-diagnostics__reason">
            {{
              t("runDiagnostics.citationCounts", {
                cited: item.data.citedClaims,
                total: item.data.totalClaims,
                violations: item.data.violations,
              })
            }}
          </span>
        </li>
      </ul>
    </section>

    <section v-if="diagnostics.ragasMetrics" class="run-diagnostics__group">
      <h4 class="run-diagnostics__subtitle">{{ t("runDiagnostics.ragas") }}</h4>
      <ul class="run-diagnostics__list">
        <li
          v-for="(data, metric) in diagnostics.ragasMetrics.scores"
          :key="metric"
          class="run-diagnostics__row"
        >
          <code class="run-diagnostics__code">{{ metric }}</code>
          <span class="run-diagnostics__pill">{{ data.score.toFixed(2) }}</span>
          <span v-if="data.reason" class="run-diagnostics__reason">{{
            data.reason
          }}</span>
        </li>
      </ul>
    </section>

    <section v-if="missingSections.length > 0" class="run-diagnostics__group">
      <h4 class="run-diagnostics__subtitle">
        {{ t("runDiagnostics.enableHintsHeading") }}
      </h4>
      <ul class="run-diagnostics__list">
        <li
          v-for="entry in missingSections"
          :key="entry.key"
          class="run-diagnostics__row"
        >
          <code class="run-diagnostics__code">{{ entry.key }}</code>
          <span class="run-diagnostics__reason">{{ localizedHint(entry) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import type { RunDiagnostics } from "@/entities/run-diagnostics";

defineProps<{
  diagnostics: RunDiagnostics;
  missingSections: { key: string; hint: string }[];
}>();

const { t } = useI18n();

function localizedHint(entry: { key: string; hint: string }): string {
  const translationKey = `runDiagnostics.hint.${entry.key}`;
  const translated = t(translationKey);
  if (translated && translated !== translationKey) return translated;
  return entry.hint;
}
</script>

<style scoped>
.run-diagnostics__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.run-diagnostics__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.run-diagnostics__subtitle {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3);
  margin: 0 0 4px;
}

.run-diagnostics__meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.run-diagnostics__list {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.run-diagnostics__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.run-diagnostics__code {
  font-family: var(--font-mono);
  color: var(--ink-2);
  font-size: 11px;
}

.run-diagnostics__reason {
  font-size: 11px;
  color: var(--ink-3);
}

.run-diagnostics__pill {
  padding: 1px 8px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11px;
  background: color-mix(in srgb, var(--ink-3) 12%, transparent);
  color: var(--ink-3);
}

.run-diagnostics__pill--entailment {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
}

.run-diagnostics__pill--contradiction {
  background: color-mix(in srgb, var(--error) 14%, transparent);
  color: var(--error);
}

.run-diagnostics__pill--accept {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
}

.run-diagnostics__pill--reject {
  background: color-mix(in srgb, var(--error) 14%, transparent);
  color: var(--error);
}

.run-diagnostics__pill--pass,
.run-diagnostics__pill--confident {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
}

.run-diagnostics__pill--revise,
.run-diagnostics__pill--uncertain {
  background: color-mix(in srgb, var(--warning) 14%, transparent);
  color: var(--warning);
}

.run-diagnostics__pill--abstain {
  background: color-mix(in srgb, var(--ink-3) 14%, transparent);
  color: var(--ink-3);
}
</style>
