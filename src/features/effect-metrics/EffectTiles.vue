<template>
  <section class="effect-tiles" :aria-label="t('effect.tiles.label')">
    <article
      v-for="tile in tiles"
      :key="tile.key"
      class="effect-tile"
      :data-testid="`tile-${tile.key}`"
    >
      <h3 class="effect-tile__label">{{ tile.label }}</h3>
      <p class="effect-tile__value" :title="tile.reason">{{ tile.value }}</p>
      <p class="effect-tile__detail">{{ tile.detail }}</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { EffectReport } from "@/shared/api/endpoints/effect-metrics";
import { ABSENT, formatCount, formatDuration, formatRate } from "./model/format";

const props = defineProps<{ report: EffectReport }>();
const { t } = useI18n();

interface Tile {
  key: string;
  label: string;
  value: string;
  detail: string;
  reason?: string;
}

function unavailableReason(...sources: string[]): string | undefined {
  const reasons = sources
    .filter((source) => props.report.source_errors[source])
    .map((source) =>
      t("effect.sourceUnavailable", { reason: props.report.source_errors[source] }),
    );
  return reasons.length ? reasons.join("\n") : undefined;
}

function sourceDetail(source: string, measured: string): string {
  return unavailableReason(source) ?? measured;
}

function sourceCount(source: string, counts: Record<string, number>): string {
  return props.report.source_errors[source] ? ABSENT : formatCount(counts[source] ?? 0);
}

const tiles = computed<Tile[]>(() => {
  const { runs, changes, tokens, duration, feedback, research, pull_requests } =
    props.report;
  return [
    {
      key: "runs",
      label: t("effect.tiles.runs"),
      value: formatCount(runs.total),
      detail: t("effect.tiles.runsDetail", {
        completed: runs.completed,
        failed: runs.failed,
        cancelled: runs.cancelled,
        awaiting: runs.awaiting_human,
      }),
    },
    {
      key: "success",
      label: t("effect.tiles.successRate"),
      value: formatRate(runs.success_rate),
      detail: t("effect.tiles.ofFinished", { count: runs.finished }),
    },
    {
      key: "files",
      label: t("effect.tiles.filesChanged"),
      value: formatCount(changes.files_changed),
      detail: t("effect.tiles.measuredIn", {
        measured: changes.runs_with_file_counts,
        total: runs.total,
      }),
    },
    {
      key: "lines",
      label: t("effect.tiles.lines"),
      value:
        changes.lines_added === null
          ? formatCount(null)
          : `+${formatCount(changes.lines_added)} / −${formatCount(changes.lines_removed)}`,
      detail: t("effect.tiles.measuredIn", {
        measured: changes.runs_with_line_counts,
        total: runs.total,
      }),
    },
    {
      key: "tokens",
      label: t("effect.tiles.tokensPerRun"),
      value: formatCount(tokens.tokens_per_run),
      detail: t("effect.tiles.tokensDetail", {
        perSuccess: formatCount(tokens.tokens_per_successful_run),
        measured: tokens.runs_with_tokens,
      }),
    },
    {
      key: "duration",
      label: t("effect.tiles.medianDuration"),
      value: formatDuration(duration.median_seconds),
      detail: t("effect.tiles.durationDetail", {
        p90: formatDuration(duration.p90_seconds),
        measured: duration.runs_with_duration,
      }),
    },
    {
      key: "feedback",
      label: t("effect.tiles.acceptRate"),
      value: formatRate(feedback?.accept_rate),
      detail: sourceDetail(
        "codegen_feedback",
        t("effect.tiles.feedbackDetail", {
          accepted: feedback?.accepted ?? 0,
          rejected: feedback?.rejected ?? 0,
          edited: feedback?.edited ?? 0,
        }),
      ),
      reason: unavailableReason("codegen_feedback"),
    },
    {
      key: "research",
      label: t("effect.tiles.keptImprovements"),
      value: formatCount(research?.kept_improvements),
      detail: sourceDetail(
        "autoresearch",
        t("effect.tiles.researchDetail", {
          improved: research?.sessions_with_improvement ?? 0,
          sessions: research?.sessions ?? 0,
        }),
      ),
      reason: unavailableReason("autoresearch"),
    },
    {
      key: "pulls",
      label: t("effect.tiles.pullRequests"),
      value: formatCount(pull_requests.total),
      detail: t("effect.tiles.pullRequestsDetail", {
        research: sourceCount("autoresearch", pull_requests.source_counts),
        issues: sourceCount("issue_autorun", pull_requests.source_counts),
      }),
      reason: unavailableReason("autoresearch", "issue_autorun"),
    },
  ];
});
</script>

<style scoped>
.effect-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.effect-tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.effect-tile__label {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}

.effect-tile__value {
  margin: 0;
  font-size: 22px;
  font-family: var(--mono);
  color: var(--text);
}

.effect-tile__detail {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
}
</style>
