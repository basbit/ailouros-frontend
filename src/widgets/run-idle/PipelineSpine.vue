<template>
  <section class="spine">
    <header class="spine__header">
      <div class="spine__caption">
        <span class="spine__caption-label">{{ t("runIdle.spineCaption") }}</span>
        <span class="spine__caption-meta">
          {{ t("runIdle.spineMeta", { count: steps.length }) }}
        </span>
      </div>
      <button type="button" class="spine__link" @click="emit('open-configure')">
        {{ t("runIdle.openConfigure") }}
      </button>
    </header>
    <ol v-if="steps.length" class="spine__track">
      <li v-for="(step, index) in steps" :key="`${step}-${index}`" class="spine__node">
        <span class="spine__bubble" :title="step">{{ index + 1 }}</span>
        <span class="spine__label">{{ step }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  steps: string[];
}>();

const emit = defineEmits<{
  "open-configure": [];
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

.spine__link {
  appearance: none;
  background: transparent;
  border: none;
  color: var(--accent-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--r-sm);
}

.spine__link:hover {
  background: var(--card);
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
  min-width: 56px;
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
</style>
