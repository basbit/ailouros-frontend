<template>
  <section class="secrets-pane">
    <PaneHeader
      :title="t('settings.secrets.title')"
      :subtitle="t('settings.secrets.subtitle')"
    />
    <div class="secrets-pane__card">
      <p v-if="secrets.error.value" class="secrets-pane__error">
        {{ secrets.error.value }}
      </p>

      <ul v-if="secrets.names.value.length" class="secrets-pane__list">
        <li v-for="name in secrets.names.value" :key="name" class="secrets-pane__row">
          <code class="secrets-pane__name">{{ name }}</code>
          <button type="button" class="secrets-pane__delete" @click="onDelete(name)">
            {{ t("settings.secrets.delete") }}
          </button>
        </li>
      </ul>
      <p v-else-if="!secrets.loading.value" class="secrets-pane__empty">
        {{ t("settings.secrets.empty") }}
      </p>

      <form class="secrets-pane__form" @submit.prevent="onAdd">
        <input
          v-model="newName"
          class="secrets-pane__input"
          :placeholder="t('settings.secrets.namePlaceholder')"
        />
        <input
          v-model="newValue"
          type="password"
          class="secrets-pane__input"
          :placeholder="t('settings.secrets.valuePlaceholder')"
        />
        <button
          type="submit"
          class="secrets-pane__add"
          :disabled="!canAdd || secrets.loading.value"
        >
          {{ t("settings.secrets.add") }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useSecrets } from "@/features/secrets/useSecrets";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const secrets = useSecrets();
const newName = ref("");
const newValue = ref("");

const canAdd = computed(
  () => newName.value.trim().length > 0 && newValue.value.length > 0,
);

onMounted(() => {
  void secrets.refresh();
});

async function onAdd(): Promise<void> {
  if (!canAdd.value) return;
  await secrets.save(newName.value.trim(), newValue.value);
  newName.value = "";
  newValue.value = "";
}

async function onDelete(name: string): Promise<void> {
  await secrets.remove(name);
}
</script>

<style scoped>
.secrets-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}

.secrets-pane__card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.secrets-pane__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.secrets-pane__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.secrets-pane__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.secrets-pane__name {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
}

.secrets-pane__delete {
  appearance: none;
  background: transparent;
  color: var(--error);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
}

.secrets-pane__empty {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.secrets-pane__form {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.secrets-pane__input {
  flex: 1;
  min-width: 120px;
}

.secrets-pane__add {
  appearance: none;
  background: var(--accent, #3b5bdb);
  color: #fff;
  border: 1px solid var(--accent, #3b5bdb);
  border-radius: var(--r-md);
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
}

.secrets-pane__add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
