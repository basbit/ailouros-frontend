<template>
  <section class="follow-up-chips" :aria-label="t('followUpChips.cardAria')">
    <header class="follow-up-chips__header">
      <h3 class="follow-up-chips__title">
        {{ t("followUpChips.headline") }}
      </h3>
      <p class="follow-up-chips__hint">
        {{ t("followUpChips.hint") }}
      </p>
    </header>

    <div v-if="status && !status.enabled" class="follow-up-chips__disabled">
      {{ t("followUpChips.disabled") }}
    </div>

    <div class="follow-up-chips__form">
      <input
        v-model.trim="query"
        type="text"
        class="follow-up-chips__input"
        :placeholder="t('followUpChips.placeholder')"
        @keydown.enter="onGenerate"
      />
      <button
        type="button"
        class="follow-up-chips__generate"
        :disabled="!canGenerate"
        @click="onGenerate"
      >
        {{
          chips.loading.value
            ? t("followUpChips.generating")
            : t("followUpChips.generate")
        }}
      </button>
    </div>

    <p v-if="chips.lastError.value" class="follow-up-chips__error">
      {{ chips.lastError.value }}
    </p>

    <ul v-if="chips.suggestions.value.length > 0" class="follow-up-chips__list">
      <li
        v-for="suggestion in chips.suggestions.value"
        :key="suggestion.rank"
        class="follow-up-chips__chip-row"
      >
        <button
          type="button"
          class="follow-up-chips__chip"
          @click="onSelect(suggestion.text)"
        >
          <span class="follow-up-chips__rank">{{ suggestion.rank }}</span>
          {{ suggestion.text }}
        </button>
      </li>
    </ul>

    <p
      v-else-if="!chips.loading.value && chips.lastQuery.value"
      class="follow-up-chips__empty"
    >
      {{ t("followUpChips.empty") }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useFollowUpChips } from "@/features/follow-up-chips/useFollowUpChips";
import { useI18n } from "@/shared/lib/i18n";

const emit = defineEmits<{
  (event: "select", text: string): void;
}>();

const { t } = useI18n();
const chips = useFollowUpChips();
const query = ref("");
const status = chips.status;

const canGenerate = computed(
  () =>
    !chips.loading.value && query.value.length > 0 && (status.value?.enabled ?? true),
);

onMounted(() => {
  void chips.ensureStatus();
});

async function onGenerate(): Promise<void> {
  if (!canGenerate.value) return;
  await chips.generate({ query: query.value });
}

function onSelect(text: string): void {
  emit("select", text);
}
</script>

<style scoped>
.follow-up-chips {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.follow-up-chips__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.follow-up-chips__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.follow-up-chips__hint {
  font-size: 12px;
  color: var(--ink-3);
  margin: 0;
}

.follow-up-chips__disabled {
  background: color-mix(in srgb, var(--warning) 14%, transparent);
  color: var(--warning);
  font-size: 12px;
  padding: 6px 10px;
  border-radius: var(--r-md);
}

.follow-up-chips__form {
  display: flex;
  gap: 8px;
}

.follow-up-chips__input {
  flex: 1 1 auto;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  font-family: inherit;
}

.follow-up-chips__generate {
  appearance: none;
  background: var(--accent);
  color: #fff;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
}

.follow-up-chips__generate:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.follow-up-chips__error {
  font-size: 12px;
  color: var(--error);
  margin: 0;
}

.follow-up-chips__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.follow-up-chips__chip {
  appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  color: var(--ink);
  border-radius: var(--r-md);
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.follow-up-chips__chip:hover {
  border-color: var(--accent);
}

.follow-up-chips__rank {
  font-size: 11px;
  color: var(--ink-3);
  min-width: 14px;
}

.follow-up-chips__empty {
  font-size: 12px;
  color: var(--ink-3);
  margin: 0;
}
</style>
