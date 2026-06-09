<template>
  <section class="red-team" :aria-label="t('redTeam.cardAria')">
    <header class="red-team__header">
      <h3 class="red-team__title">{{ t("redTeam.headline") }}</h3>
      <button
        type="button"
        class="red-team__btn"
        :disabled="store.loading.value"
        @click="store.refresh"
      >
        {{ store.loading.value ? t("redTeam.refreshing") : t("redTeam.refresh") }}
      </button>
    </header>

    <p v-if="store.lastError.value" class="red-team__error">
      {{ store.lastError.value }}
    </p>

    <p v-if="!corpus && !store.loading.value" class="red-team__hint">
      {{ t("redTeam.empty") }}
    </p>

    <div v-if="corpus" class="red-team__body">
      <p class="red-team__meta">
        {{
          t("redTeam.summary", {
            count: corpus.count,
            schedule: corpus.schedule,
          })
        }}
      </p>
      <ul class="red-team__list">
        <li v-for="probe in corpus.probes" :key="probe.probeId" class="red-team__probe">
          <div class="red-team__probe-head">
            <code class="red-team__probe-id">{{ probe.probeId }}</code>
            <span
              class="red-team__category"
              :class="`red-team__category--${probe.category}`"
            >
              {{ probe.category }}
            </span>
          </div>
          <p v-if="probe.description" class="red-team__description">
            {{ probe.description }}
          </p>
          <pre class="red-team__input">{{ probe.inputText }}</pre>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useRedTeamCorpus } from "@/features/red-team/useRedTeamCorpus";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const store = useRedTeamCorpus();
const corpus = computed(() => store.corpus.value);

onMounted(() => {
  if (!corpus.value) {
    void store.refresh();
  }
});
</script>

<style scoped>
.red-team {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.red-team__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.red-team__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.red-team__btn {
  appearance: none;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.red-team__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.red-team__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.red-team__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.red-team__meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.red-team__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.red-team__probe {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 10px;
  background: var(--bg-elev);
}

.red-team__probe-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.red-team__probe-id {
  font-family: var(--font-mono);
  color: var(--ink-2);
}

.red-team__category {
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  color: var(--ink-3);
}

.red-team__category--prompt_injection {
  border-color: color-mix(in srgb, var(--error) 30%, var(--line));
  color: var(--error);
}

.red-team__category--off_topic {
  border-color: color-mix(in srgb, var(--warning) 30%, var(--line));
  color: var(--warning);
}

.red-team__category--citation_required {
  border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
  color: var(--accent);
}

.red-team__description {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-2);
}

.red-team__input {
  margin: 4px 0 0;
  font-size: 11px;
  font-family: var(--font-mono);
  background: var(--bg);
  color: var(--ink-3);
  border-radius: var(--r-sm);
  padding: 6px 8px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
