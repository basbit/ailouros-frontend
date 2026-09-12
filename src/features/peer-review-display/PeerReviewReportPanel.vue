<template>
  <div v-if="report || loading || error" class="peer-review-panel">
    <header class="peer-review-header">
      <div class="peer-review-header__title-group">
        <span class="peer-review-icon">&#128737;</span>
        <h4 class="peer-review-title">{{ t("peerReview.title") }}</h4>
      </div>

      <div v-if="report" class="peer-review-verdict">
        <span
          class="peer-review-badge"
          :class="isLgtm ? 'peer-review-badge--success' : 'peer-review-badge--danger'"
        >
          {{
            isLgtm
              ? t("peerReview.lgtm")
              : `${t("peerReview.needsFixes")} (${t("peerReview.criticalIssues", { count: criticalCount })})`
          }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="peer-review-loading">
      <span>{{ t("peerReview.loading") }}</span>
    </div>

    <div v-else-if="error" class="peer-review-error" role="alert">
      <span class="chip chip--failed">{{ t("peerReview.loadFailed") }}</span>
      <p class="peer-review-error__detail">{{ error }}</p>
      <button type="button" class="btn-secondary" @click="emit('retry')">
        {{ t("peerReview.retry") }}
      </button>
    </div>

    <div v-else-if="report" class="peer-review-body">
      <p class="peer-review-summary">{{ report.summary }}</p>

      <div v-if="report.findings.length > 0" class="peer-review-findings">
        <h5 class="peer-review-findings-title">{{ t("peerReview.findingsTitle") }}</h5>
        <ul class="peer-review-findings-list">
          <li
            v-for="(finding, idx) in report.findings"
            :key="idx"
            class="peer-review-finding-item"
            :class="`peer-review-finding-item--${finding.severity.toLowerCase()}`"
          >
            <span
              class="peer-review-severity-chip"
              :class="`peer-review-severity-chip--${finding.severity.toLowerCase()}`"
            >
              {{ finding.severity }}
            </span>

            <div class="peer-review-finding-details">
              <span class="peer-review-finding-location">
                <code>{{ finding.file_path }}:{{ finding.line_number }}</code>
              </span>
              <span class="peer-review-finding-message">{{ finding.message }}</span>
            </div>

            <button
              type="button"
              class="peer-review-inspect-btn"
              @click="
                emit('inspectFile', {
                  path: finding.file_path,
                  line: finding.line_number,
                })
              "
            >
              &#8599; {{ t("peerReview.inspectFile") }}
            </button>
          </li>
        </ul>
      </div>

      <p v-else class="peer-review-empty">&check; {{ t("peerReview.noFindings") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { PeerReviewReport } from "@/entities/review/model/types";

const props = defineProps<{
  report: PeerReviewReport | null;
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  inspectFile: [{ path: string; line: number }];
  retry: [];
}>();

const { t } = useI18n();

const isLgtm = computed(() => props.report?.verdict === "lgtm");
const criticalCount = computed(
  () =>
    props.report?.findings.filter((finding) => finding.severity === "CRITICAL")
      .length ?? 0,
);
</script>

<style scoped>
.peer-review-panel {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.peer-review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.peer-review-header__title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.peer-review-icon {
  font-size: 14px;
}

.peer-review-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.peer-review-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.peer-review-badge--success {
  background: color-mix(in srgb, var(--ok) 20%, transparent);
  color: var(--ok);
  border: 1px solid color-mix(in srgb, var(--ok) 40%, transparent);
}

.peer-review-badge--danger {
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
}

.peer-review-summary {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.5;
}

.peer-review-findings {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.peer-review-findings-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.peer-review-findings-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.peer-review-finding-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: var(--r-sm);
  background: var(--card-soft);
  border: 1px solid var(--line);
}

.peer-review-severity-chip {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: var(--r-sm);
}

.peer-review-severity-chip--critical {
  background: color-mix(in srgb, var(--error) 20%, transparent);
  color: var(--error);
}

.peer-review-severity-chip--warning {
  background: color-mix(in srgb, var(--warn) 20%, transparent);
  color: var(--warn);
}

.peer-review-severity-chip--info {
  background: color-mix(in srgb, var(--info) 20%, transparent);
  color: var(--info);
}

.peer-review-finding-details {
  flex: 1 1 auto;
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.peer-review-finding-location code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.peer-review-finding-message {
  font-size: 12px;
  color: var(--ink);
  word-break: break-word;
}

.peer-review-inspect-btn {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--r-sm);
  background: transparent;
  border: 1px solid var(--line);
  color: var(--ink-2);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.peer-review-inspect-btn:hover {
  background: var(--card-soft);
  color: var(--ink);
}

.peer-review-empty {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ok);
}

.peer-review-loading {
  font-size: 12px;
  color: var(--ink-3);
  font-style: italic;
}
</style>
