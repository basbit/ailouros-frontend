<template>
  <section class="spec-validator">
    <header class="spec-validator__head">
      <h3 class="spec-validator__title">Validation</h3>
      <span v-if="result" :class="['spec-validator__badge', result.ok ? 'ok' : 'bad']">
        {{ result.ok ? "ok" : "issues" }}
      </span>
    </header>
    <div v-if="loading" class="spec-validator__hint">Loading…</div>
    <div v-else-if="notImplemented" class="spec-validator__hint">
      Validation endpoint not available yet.
    </div>
    <div v-else-if="error" class="spec-validator__error">{{ error }}</div>
    <div v-else-if="!result" class="spec-validator__hint">
      No validation result yet.
    </div>
    <div v-else>
      <p v-if="!result.findings.length" class="spec-validator__hint">No findings.</p>
      <ul v-else class="spec-validator__list">
        <li
          v-for="(finding, idx) in result.findings"
          :key="idx"
          :class="[
            'spec-validator__finding',
            `spec-validator__finding--${finding.severity}`,
          ]"
        >
          <div class="spec-validator__finding-head">
            <code class="spec-validator__code">{{ finding.code }}</code>
            <span class="spec-validator__sev">{{ finding.severity }}</span>
          </div>
          <p class="spec-validator__msg">{{ finding.message }}</p>
          <div v-if="finding.refs && finding.refs.length" class="spec-validator__refs">
            <code v-for="ref in finding.refs" :key="ref" class="spec-validator__ref">
              {{ ref }}
            </code>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import type { SpecValidationResult } from "./spec-types";
import { useSpecValidation } from "./useSpecValidation";

const props = defineProps<{
  specId?: string | null;
  initial?: SpecValidationResult | null;
  /** When false, skips the fetch — useful for tests and storybook. */
  autoFetch?: boolean;
}>();

const { result, loading, error, notImplemented, load } = useSpecValidation(
  props.initial ?? null,
);

onMounted(() => {
  if (props.autoFetch === false) return;
  if (!props.specId) return;
  void load(props.specId);
});

watch(
  () => props.specId,
  (next) => {
    if (props.autoFetch === false) return;
    if (!next) return;
    void load(next);
  },
);
</script>

<style scoped>
.spec-validator {
  border: 1px solid #e2e2e6;
  border-radius: 8px;
  padding: 12px;
}
.spec-validator__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.spec-validator__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.spec-validator__badge {
  text-transform: uppercase;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}
.spec-validator__badge.ok {
  background: #d8ebd9;
  color: #1f6f2b;
}
.spec-validator__badge.bad {
  background: #fde0dc;
  color: #8b1a10;
}
.spec-validator__hint,
.spec-validator__error {
  color: #888;
  font-size: 13px;
}
.spec-validator__error {
  color: #c0392b;
}
.spec-validator__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.spec-validator__finding {
  background: #fafafb;
  border-radius: 6px;
  padding: 8px;
  border-left: 3px solid #ccc;
}
.spec-validator__finding--error {
  border-left-color: #c0392b;
}
.spec-validator__finding--warning {
  border-left-color: #d4a017;
}
.spec-validator__finding--info {
  border-left-color: #2f6fb3;
}
.spec-validator__finding-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
}
.spec-validator__code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  color: #555;
}
.spec-validator__sev {
  text-transform: uppercase;
  font-size: 11px;
  color: #888;
  letter-spacing: 0.04em;
}
.spec-validator__msg {
  margin: 4px 0 0;
  font-size: 13px;
}
.spec-validator__refs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.spec-validator__ref {
  font-family: ui-monospace, SFMono-Regular, monospace;
  background: #f0f0f3;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
}
</style>
