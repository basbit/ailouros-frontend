<template>
  <section class="ar-session">
    <header class="ar-session__header">
      <h2 class="ar-session__goal">{{ session.config.goal }}</h2>
      <span
        :class="['ar-session__status', `ar-session__status--${session.status}`]"
        data-testid="session-status"
      >
        {{ t(`autoresearch.status.${session.status}`) }}
      </span>
      <span v-if="active" class="ar-session__polling">{{
        t("autoresearch.view.polling")
      }}</span>
    </header>

    <dl class="ar-session__stats">
      <div>
        <dt>{{ t("autoresearch.view.baseline") }}</dt>
        <dd data-testid="baseline">{{ formatMetricValue(session.baseline) }}</dd>
      </div>
      <div>
        <dt>{{ t("autoresearch.view.best") }}</dt>
        <dd data-testid="best">{{ formatMetricValue(session.best_value) }}</dd>
      </div>
      <div>
        <dt>{{ t("autoresearch.view.kept") }}</dt>
        <dd>{{ session.kept_count }} / {{ session.iterations.length }}</dd>
      </div>
      <div>
        <dt>{{ t("autoresearch.view.tokens") }}</dt>
        <dd>{{ session.total_input_tokens }} / {{ session.total_output_tokens }}</dd>
      </div>
      <div>
        <dt>{{ t("autoresearch.view.branch") }}</dt>
        <dd class="ar-session__mono">{{ session.branch || "—" }}</dd>
      </div>
    </dl>
    <p v-if="session.stop_reason" class="ar-session__reason">
      {{ t("autoresearch.view.stopReason") }}: {{ session.stop_reason }}
    </p>

    <MetricChart :session="session" />

    <table class="ar-session__table">
      <thead>
        <tr>
          <th>{{ t("autoresearch.view.table.number") }}</th>
          <th>{{ t("autoresearch.view.table.hypothesis") }}</th>
          <th>{{ t("autoresearch.view.table.value") }}</th>
          <th>{{ t("autoresearch.view.table.delta") }}</th>
          <th>{{ t("autoresearch.view.table.decision") }}</th>
          <th>{{ t("autoresearch.view.table.reason") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!session.iterations.length">
          <td colspan="6" class="ar-session__empty">
            {{ t("autoresearch.view.noIterations") }}
          </td>
        </tr>
        <tr
          v-for="iteration in session.iterations"
          :key="iteration.number"
          :class="`ar-session__row--${iteration.decision}`"
          data-testid="iteration-row"
        >
          <td>{{ iteration.number }}</td>
          <td>{{ iteration.hypothesis || "—" }}</td>
          <td class="ar-session__mono">{{ formatMetricValue(iteration.value) }}</td>
          <td class="ar-session__mono">
            {{ formatDeltaPct(iteration.improvement_pct) }}
          </td>
          <td>{{ t(`autoresearch.decision.${iteration.decision}`) }}</td>
          <td class="ar-session__reason-cell">{{ iteration.reason }}</td>
        </tr>
      </tbody>
    </table>

    <div class="ar-session__actions">
      <button
        v-if="active"
        type="button"
        :disabled="!!busyAction"
        data-testid="action-cancel"
        @click="emit('action', 'cancel')"
      >
        {{ t("autoresearch.actions.cancel") }}
      </button>
      <template v-if="canPublish">
        <button
          type="button"
          :disabled="!!busyAction || !!session.pull_request_url"
          data-testid="action-pullRequest"
          @click="emit('action', 'pullRequest')"
        >
          {{ t("autoresearch.actions.pullRequest") }}
        </button>
        <button
          type="button"
          :disabled="!!busyAction || session.applied_files.length > 0"
          data-testid="action-apply"
          @click="emit('action', 'apply')"
        >
          {{ t("autoresearch.actions.apply") }}
        </button>
      </template>
      <button
        v-if="!active && !session.discarded"
        type="button"
        :disabled="!!busyAction"
        data-testid="action-discard"
        @click="emit('action', 'discard')"
      >
        {{ t("autoresearch.actions.discard") }}
      </button>
    </div>
    <p v-if="actionError" class="ar-session__error" data-testid="action-error">
      {{ actionError }}
    </p>
    <p v-if="session.pull_request_url" class="ar-session__result">
      {{ t("autoresearch.result.pullRequest") }}:
      <a :href="session.pull_request_url" target="_blank" rel="noopener">{{
        session.pull_request_url
      }}</a>
    </p>
    <p v-if="session.applied_files.length" class="ar-session__result">
      {{
        t("autoresearch.result.applied", { files: session.applied_files.join(", ") })
      }}
    </p>
    <p v-if="session.discarded" class="ar-session__result">
      {{ t("autoresearch.result.discarded") }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { ResearchSession } from "@/shared/api/endpoints/autoresearch";
import MetricChart from "./MetricChart.vue";
import { formatDeltaPct, formatMetricValue, isSessionActive } from "./model/format";
import type { SessionAction } from "./useAutoresearchSession";

const props = defineProps<{
  session: ResearchSession;
  busyAction: SessionAction | null;
  actionError: string;
}>();
const emit = defineEmits<{ action: [action: SessionAction] }>();
const { t } = useI18n();

const active = computed(() => isSessionActive(props.session.status));
const canPublish = computed(
  () => !active.value && !props.session.discarded && props.session.kept_count > 0,
);
</script>

<style scoped>
.ar-session {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ar-session__header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
}

.ar-session__goal {
  margin: 0;
  font-size: 15px;
}

.ar-session__status {
  padding: 1px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 11px;
}

.ar-session__status--completed {
  color: var(--success);
}

.ar-session__status--failed {
  color: var(--danger);
}

.ar-session__polling,
.ar-session__reason,
.ar-session__empty {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.ar-session__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 0;
}

.ar-session__stats dt {
  color: var(--muted);
  font-size: 11px;
}

.ar-session__stats dd {
  margin: 0;
  font-size: 14px;
}

.ar-session__mono {
  font-family: var(--mono);
}

.ar-session__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ar-session__table th,
.ar-session__table td {
  padding: 4px 6px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

.ar-session__row--kept td:nth-child(5) {
  color: var(--success);
}

.ar-session__row--error td:nth-child(5) {
  color: var(--danger);
}

.ar-session__reason-cell {
  color: var(--muted);
  word-break: break-word;
}

.ar-session__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ar-session__actions button {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}

.ar-session__actions button:disabled {
  opacity: 0.6;
  cursor: default;
}

.ar-session__error {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
  white-space: pre-wrap;
}

.ar-session__result {
  margin: 0;
  font-size: 12px;
}
</style>
