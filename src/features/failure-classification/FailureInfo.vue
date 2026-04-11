<template>
  <div v-if="failure" class="failure-info">
    <div class="failure-info__header">
      <span class="failure-info__badge" :class="`failure-info__badge--${failure.type}`">
        {{ failure.type }}
      </span>
      <span v-if="failure.retryable" class="failure-info__retryable">retryable</span>
    </div>
    <p class="failure-info__error">{{ failure.originalError }}</p>
    <p class="failure-info__mitigation">
      <strong>Suggested action:</strong> {{ failure.suggestedMitigation }}
    </p>
  </div>
</template>

<script setup lang="ts">
export interface FailureDetails {
  type: string;
  originalError: string;
  suggestedMitigation: string;
  retryable: boolean;
}

defineProps<{
  failure: FailureDetails | null;
}>();
</script>

<style scoped>
.failure-info {
  padding: 12px 16px;
  border-left: 3px solid #e55;
  background: #fff5f5;
  border-radius: 4px;
  font-size: 0.875rem;
}

.failure-info__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.failure-info__badge {
  padding: 2px 8px;
  border-radius: 12px;
  background: #f0f0f0;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.failure-info__badge--timeout {
  background: #fff3cd;
  color: #856404;
}
.failure-info__badge--context_overflow {
  background: #d1ecf1;
  color: #0c5460;
}
.failure-info__badge--logic_error {
  background: #f8d7da;
  color: #721c24;
}
.failure-info__badge--external_api {
  background: #fde2e2;
  color: #c0392b;
}
.failure-info__badge--model_refusal {
  background: #e2d9f3;
  color: #4a235a;
}
.failure-info__badge--mcp_failure {
  background: #d4edda;
  color: #155724;
}
.failure-info__badge--unknown {
  background: #e0e0e0;
  color: #555;
}

.failure-info__retryable {
  font-size: 0.7rem;
  color: #888;
  font-style: italic;
}

.failure-info__error {
  margin: 0 0 4px;
  color: #c0392b;
  word-break: break-word;
}

.failure-info__mitigation {
  margin: 0;
  color: #333;
}
</style>
