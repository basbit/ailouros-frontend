<template>
  <span
    v-if="parsed"
    class="spec-status-chip"
    :class="{ 'is-blocked': parsed.isBlocked }"
    :title="parsed.blockingCondition || undefined"
  >
    <span class="spec-status-chip__label">{{ t("specStatus.label") }}</span>
    <span class="spec-status-chip__value">{{ t(`specStatus.${parsed.status}`) }}</span>
    <span
      v-if="parsed.isBlocked && parsed.blockingCondition"
      class="spec-status-chip__reason"
    >
      {{ parsed.blockingCondition }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { parseSpecStatus } from "@/shared/model/spec-status-types";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ status: unknown }>();

const { t } = useI18n();

const parsed = computed(() => parseSpecStatus(props.status));
</script>

<style scoped>
.spec-status-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  max-width: 100%;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: var(--r-sm, 6px);
  background: var(--card);
  font-size: 12px;
  line-height: 1.6;
}

.spec-status-chip__label {
  color: var(--muted);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.spec-status-chip__value {
  color: var(--ink);
  font-weight: 500;
}

.spec-status-chip__reason {
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec-status-chip.is-blocked {
  border-color: var(--danger, #b3261e);
}

.spec-status-chip.is-blocked .spec-status-chip__value {
  color: var(--danger, #b3261e);
}
</style>
