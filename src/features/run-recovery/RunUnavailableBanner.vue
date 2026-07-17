<template>
  <section class="run-unavailable" role="alert">
    <h2 class="run-unavailable__title">{{ title }}</h2>
    <p class="run-unavailable__message">{{ message }}</p>
    <button type="button" class="run-unavailable__reset" @click="emit('reset')">
      {{ t("runUnavailable.reset") }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { RunAvailability } from "@/shared/model/task-types";

const props = defineProps<{
  availability: RunAvailability;
  taskId: string;
  lookupError: string | null;
}>();

const emit = defineEmits<{ (event: "reset"): void }>();

const { t } = useI18n();

const title = computed(() =>
  props.availability === "lookup_failed"
    ? t("runUnavailable.lookupFailed.title")
    : t("runUnavailable.unknown.title"),
);

const message = computed(() =>
  props.availability === "lookup_failed"
    ? t("runUnavailable.lookupFailed.message", {
        taskId: props.taskId,
        error: props.lookupError ?? "",
      })
    : t("runUnavailable.unknown.message", { taskId: props.taskId }),
);
</script>

<style scoped>
.run-unavailable {
  padding: 12px 16px;
  border: 1px solid var(--error);
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--error) 10%, transparent);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.run-unavailable__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--error);
}

.run-unavailable__message {
  margin: 0;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.4;
}

.run-unavailable__reset {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.run-unavailable__reset:hover {
  border-color: var(--error);
}
</style>
