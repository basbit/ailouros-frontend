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
.pipeline-summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
  color: var(--text2, #9dadd0);
  padding: 2px 8px;
  background: var(--bg2, #1e2230);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 12px;
}
.pipeline-summary__count {
  font-weight: 600;
  color: var(--text1, #c8cfe8);
}
.pipeline-summary__sep {
  opacity: 0.4;
}
.pipeline-summary__chip {
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.4;
}
.pipeline-summary__chip--agent {
  background: rgba(59, 91, 219, 0.18);
  color: #a7baf5;
}
.pipeline-summary__chip--reviewer {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd67a;
}
.pipeline-summary__chip--human {
  background: rgba(56, 189, 148, 0.18);
  color: #7ed7b7;
}
.pipeline-summary__chip--verify {
  background: rgba(156, 163, 175, 0.2);
  color: #c9cdd6;
}
</style>
