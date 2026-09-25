<template>
  <section class="effect-wins">
    <div class="effect-wins__block">
      <h3 class="effect-wins__title">{{ t("effect.wins.title") }}</h3>
      <p v-if="researchError" class="effect-wins__muted">
        {{ t("effect.sourceUnavailable", { reason: researchError }) }}
      </p>
      <p v-else-if="!wins.length" class="effect-wins__muted">
        {{ t("effect.wins.empty") }}
      </p>
      <table v-else class="effect-wins__table" data-testid="wins-table">
        <thead>
          <tr>
            <th>{{ t("effect.wins.goal") }}</th>
            <th>{{ t("effect.wins.kept") }}</th>
            <th>{{ t("effect.wins.best") }}</th>
            <th>{{ t("effect.wins.started") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in wins" :key="session.session_id">
            <td>
              <RouterLink :to="`/autoresearch/${session.session_id}`">{{
                session.goal
              }}</RouterLink>
            </td>
            <td>{{ session.kept_count }}</td>
            <td>{{ formatSignedPercent(session.best_improvement_pct) }}</td>
            <td>{{ session.created_at.slice(0, 10) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="effect-wins__block">
      <h3 class="effect-wins__title">{{ t("effect.pulls.title") }}</h3>
      <p v-if="autorunError" class="effect-wins__muted">
        {{ t("effect.sourceUnavailable", { reason: autorunError }) }}
      </p>
      <p v-if="!pulls.length" class="effect-wins__muted">
        {{ t("effect.pulls.empty") }}
      </p>
      <table v-else class="effect-wins__table" data-testid="pulls-table">
        <thead>
          <tr>
            <th>{{ t("effect.pulls.link") }}</th>
            <th>{{ t("effect.pulls.source") }}</th>
            <th>{{ t("effect.pulls.date") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pull in pulls" :key="pull.url">
            <td>
              <a :href="pull.url" target="_blank" rel="noopener noreferrer">{{
                pull.url
              }}</a>
            </td>
            <td>{{ t(`effect.pulls.sources.${pull.source}`) }}</td>
            <td>{{ pull.recorded_at.slice(0, 10) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { EffectReport } from "@/shared/api/endpoints/effect-metrics";
import { formatSignedPercent } from "./model/format";

const TABLE_ROWS = 10;

const props = defineProps<{ report: EffectReport }>();
const { t } = useI18n();

const researchError = computed(() => props.report.source_errors.autoresearch ?? "");
const autorunError = computed(() => props.report.source_errors.issue_autorun ?? "");
const wins = computed(() =>
  (props.report.research?.items ?? [])
    .filter((session) => session.kept_count > 0)
    .slice(0, TABLE_ROWS),
);
const pulls = computed(() => props.report.pull_requests.items.slice(0, TABLE_ROWS));
</script>

<style scoped>
.effect-wins {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.effect-wins__block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.effect-wins__title {
  margin: 0;
  font-size: 13px;
}

.effect-wins__muted {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.effect-wins__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.effect-wins__table th,
.effect-wins__table td {
  padding: 4px 6px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  overflow-wrap: anywhere;
}

.effect-wins__table th {
  color: var(--muted);
  font-weight: 500;
}
</style>
