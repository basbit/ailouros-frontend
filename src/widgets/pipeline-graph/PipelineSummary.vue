<template>
  <div class="pipeline-summary" :title="tooltip">
    <span class="pipeline-summary__count">{{
      t("pipelineSummary.steps", { n: summary.total })
    }}</span>
    <template v-if="summary.total">
      <span class="pipeline-summary__sep">·</span>
      <span
        v-if="summary.agent"
        class="pipeline-summary__chip pipeline-summary__chip--agent"
      >
        {{ summary.agent }} {{ t("pipelineSummary.agents") }}
      </span>
      <span
        v-if="summary.reviewer"
        class="pipeline-summary__chip pipeline-summary__chip--reviewer"
      >
        {{ summary.reviewer }} {{ t("pipelineSummary.reviewers") }}
      </span>
      <span
        v-if="summary.human_gate"
        class="pipeline-summary__chip pipeline-summary__chip--human"
      >
        {{ summary.human_gate }} {{ t("pipelineSummary.humanGates") }}
      </span>
      <span
        v-if="summary.verification"
        class="pipeline-summary__chip pipeline-summary__chip--verify"
      >
        {{ summary.verification }} {{ t("pipelineSummary.verification") }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { summarizeSteps } from "@/shared/lib/step-taxonomy";

const props = defineProps<{ steps: ReadonlyArray<string> }>();
const { t } = useI18n();

const summary = computed(() => summarizeSteps(props.steps));

const tooltip = computed(() => {
  const s = summary.value;
  const parts: string[] = [];
  if (s.agent) parts.push(`${s.agent} agents`);
  if (s.reviewer) parts.push(`${s.reviewer} reviewers`);
  if (s.human_gate) parts.push(`${s.human_gate} human gates`);
  if (s.verification) parts.push(`${s.verification} verification`);
  if (s.tool_preflight) parts.push(`${s.tool_preflight} tool/preflight`);
  if (s.join_branch) parts.push(`${s.join_branch} join/branch`);
  return parts.length ? `Pipeline breakdown: ${parts.join(", ")}` : "Pipeline is empty";
});
</script>

<style scoped>
/*
 * Chip colors are built from theme tokens via color-mix so that every chip
 * keeps ≥4.5:1 contrast in both dark and light themes. Text uses the full
 * semantic token; background is the same token mixed into the surface.
 */
.pipeline-summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--text2);
  padding: 2px 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.pipeline-summary__count {
  font-weight: 600;
  color: var(--text);
}
.pipeline-summary__sep {
  color: var(--text3);
  opacity: 0.6;
}
.pipeline-summary__chip {
  padding: 1px 7px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
  border: 1px solid transparent;
}
.pipeline-summary__chip--agent {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, var(--surface));
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
}
.pipeline-summary__chip--reviewer {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 14%, var(--surface));
  border-color: color-mix(in srgb, var(--warning) 32%, transparent);
}
.pipeline-summary__chip--human {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 14%, var(--surface));
  border-color: color-mix(in srgb, var(--success) 32%, transparent);
}
.pipeline-summary__chip--verify {
  color: var(--text2);
  background: color-mix(in srgb, var(--text2) 10%, var(--surface));
  border-color: color-mix(in srgb, var(--text2) 24%, transparent);
}
</style>
