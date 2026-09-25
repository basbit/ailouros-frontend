<template>
  <div class="env-catalog">
    <div class="hint">{{ t("envCatalog.hint") }}</div>

    <div class="env-catalog__toolbar">
      <input
        v-model="catalog.query.value"
        type="search"
        class="env-catalog__search"
        :placeholder="t('envCatalog.searchPlaceholder')"
        :aria-label="t('envCatalog.searchPlaceholder')"
      />
      <button
        type="button"
        class="env-catalog__save"
        :disabled="!catalog.dirtyNames.value.length || catalog.saving.value"
        @click="catalog.save()"
      >
        {{
          catalog.saving.value
            ? t("envCatalog.saving")
            : t("envCatalog.save", { count: catalog.dirtyNames.value.length })
        }}
      </button>
    </div>

    <div v-if="catalog.loading.value" class="hint">{{ t("envCatalog.loading") }}</div>
    <div v-else-if="catalog.error.value" class="env-catalog__error">
      {{ catalog.error.value }}
    </div>
    <div v-else-if="!catalog.groups.value.length" class="hint">
      {{ t("envCatalog.empty") }}
    </div>

    <details
      v-for="group in catalog.groups.value"
      :key="group.name"
      class="env-catalog__group"
    >
      <summary>
        {{ group.name }}
        <span class="env-catalog__count">{{ group.variables.length }}</span>
      </summary>
      <div class="env-catalog__group-body">
        <div
          v-for="variable in group.variables"
          :key="variable.name"
          class="env-catalog__row"
        >
          <label :for="`env-${variable.name}`" class="env-catalog__label">
            <code>{{ variable.name }}</code>
            <span v-if="variable.managed_by_ui_field" class="env-catalog__badge">
              {{ t("envCatalog.alsoInFeatureFlags") }}
            </span>
            <span
              v-if="variable.is_set"
              class="env-catalog__badge env-catalog__badge--set"
            >
              {{ t("envCatalog.overridden") }}
            </span>
            <span
              v-if="variable.restart_required"
              class="env-catalog__badge env-catalog__badge--restart"
              :title="t('settingsField.restart.hint')"
              :data-test="`env-restart-required-${variable.name}`"
            >
              {{
                variable.restart_pending
                  ? t("envCatalog.restartPending")
                  : t("envCatalog.restartRequired")
              }}
            </span>
          </label>

          <select
            v-if="variable.kind === 'boolean'"
            :id="`env-${variable.name}`"
            :value="catalog.currentValue(variable)"
            @change="
              catalog.setValue(
                variable.name,
                ($event.target as HTMLSelectElement).value,
              )
            "
          >
            <option value="">
              {{ t("envCatalog.useDefault", { value: variable.default || "—" }) }}
            </option>
            <option value="1">{{ t("envCatalog.on") }}</option>
            <option value="0">{{ t("envCatalog.off") }}</option>
          </select>
          <input
            v-else
            :id="`env-${variable.name}`"
            :type="variable.is_secret ? 'password' : 'text'"
            :inputmode="
              variable.kind === 'integer' || variable.kind === 'float'
                ? 'numeric'
                : undefined
            "
            :value="catalog.currentValue(variable)"
            :placeholder="variable.default || t('envCatalog.notSet')"
            autocomplete="off"
            @input="
              catalog.setValue(variable.name, ($event.target as HTMLInputElement).value)
            "
          />

          <p v-if="variable.description" class="env-catalog__description">
            {{ variable.description }}
          </p>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useEnvCatalog } from "./useEnvCatalog";

const { t } = useI18n();
const catalog = useEnvCatalog();

onMounted(() => {
  void catalog.load();
});
</script>

<style scoped>
.env-catalog__toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.env-catalog__search {
  flex: 1 1 auto;
}

.env-catalog__group {
  border-top: 1px solid var(--border);
  padding: 6px 0;
}

.env-catalog__group summary {
  cursor: pointer;
  font-weight: 600;
}

.env-catalog__count {
  color: var(--muted);
  font-weight: 400;
  margin-left: 6px;
}

.env-catalog__group-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0 4px;
}

.env-catalog__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.env-catalog__label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.env-catalog__badge {
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0 6px;
}

.env-catalog__badge--set {
  color: var(--accent, inherit);
}

.env-catalog__description {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.env-catalog__error {
  color: var(--danger, #c0392b);
}

.env-catalog__badge--restart {
  color: var(--c-warning-text, #8a5a00);
  border-color: var(--c-warning-border, #f0c34a);
}
</style>
