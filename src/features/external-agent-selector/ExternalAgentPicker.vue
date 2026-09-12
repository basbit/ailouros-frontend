<template>
  <div class="agent-picker">
    <div class="agent-picker__header">
      <span class="agent-picker__title">{{ t("externalAgents.title") }}</span>
    </div>

    <div v-if="isLoading" class="agent-picker__loading">
      {{ t("externalAgents.loading") }}
    </div>

    <div v-else class="agent-picker__list">
      <div
        v-for="harness in harnesses"
        :key="harness.generator_type"
        class="agent-picker__item"
        :class="{
          'agent-picker__item--selected': harness.generator_type === selectedType,
          'agent-picker__item--disabled': !harness.is_available,
        }"
        role="button"
        tabindex="0"
        @click="selectHarness(harness)"
        @keydown.enter="selectHarness(harness)"
      >
        <div class="agent-picker__item-header">
          <span class="agent-picker__name">{{ harness.name }}</span>
          <span
            class="agent-picker__badge chip"
            :class="{
              'agent-picker__badge--ok': harness.is_available,
              'agent-picker__badge--missing': !harness.is_available,
            }"
          >
            {{
              harness.is_available
                ? t("externalAgents.installed")
                : t("externalAgents.notInstalled")
            }}
          </span>
        </div>
        <p class="agent-picker__desc">{{ harness.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { fetchExternalHarnesses } from "@/entities/external-agent/api/external-agent-api";
import type { ExternalHarness } from "@/entities/external-agent/model/types";

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "select", harness: ExternalHarness): void;
}>();

const { t } = useI18n();

const harnesses = ref<ExternalHarness[]>([]);
const isLoading = ref(false);
const selectedType = ref(props.modelValue || "native");

function selectHarness(harness: ExternalHarness): void {
  if (!harness.is_available) return;
  selectedType.value = harness.generator_type;
  emit("update:modelValue", harness.generator_type);
  emit("select", harness);
}

async function loadHarnesses(): Promise<void> {
  isLoading.value = true;
  try {
    harnesses.value = await fetchExternalHarnesses();
  } catch {
    harnesses.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadHarnesses();
});
</script>

<style scoped>
.agent-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-picker__header {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.agent-picker__loading {
  font-size: 12px;
  color: var(--ink-3);
}

.agent-picker__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.agent-picker__item {
  padding: 8px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  cursor: pointer;
  transition: all 0.15s ease;
}

.agent-picker__item:hover:not(.agent-picker__item--disabled) {
  border-color: var(--accent);
  background: var(--card-soft);
}

.agent-picker__item--selected {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.agent-picker__item--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.agent-picker__item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-picker__name {
  font-weight: 500;
  font-size: 13px;
}

/* Pill shape and border come from the shared .chip. */
.agent-picker__badge {
  font-size: 11px;
  padding: 2px 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.agent-picker__badge--ok {
  background: var(--ok-soft);
  border-color: color-mix(in srgb, var(--ok) 35%, transparent);
  color: var(--ok);
}

.agent-picker__badge--missing {
  background: var(--card-soft);
  border-color: var(--line);
  color: var(--ink-3);
}

.agent-picker__desc {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--ink-3);
}
</style>
