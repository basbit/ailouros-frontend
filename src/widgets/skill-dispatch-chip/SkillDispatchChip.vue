<template>
  <section class="skill-dispatch-chip" :aria-label="t('skillDispatch.cardAria')">
    <header class="skill-dispatch-chip__header">
      <h3 class="skill-dispatch-chip__title">{{ t("skillDispatch.headline") }}</h3>
    </header>

    <label class="skill-dispatch-chip__field">
      {{ t("skillDispatch.userInputLabel") }}
      <textarea
        v-model="userInput"
        class="skill-dispatch-chip__textarea"
        rows="3"
        :placeholder="t('skillDispatch.userInputPlaceholder')"
      />
    </label>

    <div class="skill-dispatch-chip__actions">
      <button
        type="button"
        class="skill-dispatch-chip__btn"
        :disabled="!canRun"
        @click="onRun"
      >
        {{
          dispatcher.loading.value ? t("skillDispatch.running") : t("skillDispatch.run")
        }}
      </button>
      <button
        type="button"
        class="skill-dispatch-chip__btn skill-dispatch-chip__btn--ghost"
        :disabled="!decision"
        @click="dispatcher.clear"
      >
        {{ t("skillDispatch.clear") }}
      </button>
    </div>

    <p v-if="dispatcher.lastError.value" class="skill-dispatch-chip__error">
      {{ dispatcher.lastError.value }}
    </p>

    <div v-if="decision" class="skill-dispatch-chip__decision">
      <span class="skill-dispatch-chip__pill">{{ decision.skillId }}</span>
      <p class="skill-dispatch-chip__reason">{{ decision.reason }}</p>
      <p class="skill-dispatch-chip__meta">
        {{
          t("skillDispatch.meta", {
            dispatcher: decision.dispatcher,
            mode: decision.mode,
          })
        }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { useSkillDispatcher } from "@/features/skill-dispatcher/useSkillDispatcher";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ scenario?: string; phase?: string }>();

const { t } = useI18n();
const dispatcher = useSkillDispatcher();
const userInput = ref("");
const decision = computed(() => dispatcher.decision.value);

const canRun = computed(
  () => !dispatcher.loading.value && userInput.value.trim().length > 0,
);

async function onRun(): Promise<void> {
  if (!canRun.value) return;
  await dispatcher.run({
    scenario: props.scenario ?? "",
    phase: props.phase ?? "",
    userInput: userInput.value,
  });
}
</script>

<style scoped>
.skill-dispatch-chip {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-dispatch-chip__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.skill-dispatch-chip__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-3);
}

.skill-dispatch-chip__textarea {
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  font-family: inherit;
  resize: vertical;
}

.skill-dispatch-chip__actions {
  display: flex;
  gap: 8px;
}

.skill-dispatch-chip__btn {
  appearance: none;
  background: var(--accent);
  color: #fff;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
}

.skill-dispatch-chip__btn--ghost {
  background: transparent;
  color: var(--ink-2);
  border-color: var(--line);
}

.skill-dispatch-chip__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.skill-dispatch-chip__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.skill-dispatch-chip__decision {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-dispatch-chip__pill {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.skill-dispatch-chip__reason {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.4;
}

.skill-dispatch-chip__meta {
  margin: 0;
  font-size: 11px;
  color: var(--ink-3);
}
</style>
