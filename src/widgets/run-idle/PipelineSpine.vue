<template>
  <section class="spine">
    <template v-if="planned && steps.length">
      <header class="spine__header">
        <div class="spine__caption">
          <span class="spine__caption-label">{{ t("runIdle.spineCaption") }}</span>
          <span class="spine__caption-meta">
            {{ t("runIdle.spineMeta", { count: steps.length }) }}
          </span>
        </div>
      </header>
      <ol class="spine__track">
        <li
          v-for="(step, index) in steps"
          :key="`${step}-${index}`"
          class="spine__node"
        >
          <span class="spine__bubble" :title="step">{{ index + 1 }}</span>
          <span class="spine__label">{{ step }}</span>
        </li>
      </ol>
    </template>
    <div v-else class="spine__empty">
      <span class="spine__empty-title">{{ t("runIdle.spineEmpty.title") }}</span>
      <span class="spine__empty-hint">{{ t("runIdle.spineEmpty.hint") }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  steps: string[];
  planned: boolean;
}>();

const { t } = useI18n();
</script>

<style scoped>
.spine {
  background: var(--card-soft);
  border-radius: var(--r-lg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spine__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spine__caption {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.spine__caption-label {
  font-size: 11px;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.spine__caption-meta {
  font-size: 11px;
  color: var(--ink-3);
}

.spine__track {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.spine__node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 0 0 80px;
}

.spine__bubble {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--card);
  border: 2px solid var(--accent);
  color: var(--accent-2);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spine__label {
  font-size: 10px;
  color: var(--ink-3);
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spine__empty {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spine__empty-title {
  font-size: 11px;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.spine__empty-hint {
  font-size: 12px;
  color: var(--ink-3);
}
</style>
