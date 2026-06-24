<template>
  <section class="model-registry-pane">
    <PaneHeader
      :title="t('settings.modelRegistry.title')"
      :subtitle="t('settings.modelRegistry.subtitle')"
    />
    <div class="model-registry-pane__toolbar">
      <button
        type="button"
        class="model-registry-pane__btn"
        :disabled="loading"
        @click="onRefresh"
      >
        {{ loading ? "…" : t("settings.modelRegistry.refresh") }}
      </button>
      <span v-if="errors.length" class="model-registry-pane__warn">
        {{ errors.join("; ") }}
      </span>
    </div>

    <p v-if="!registry.length && !loading" class="model-registry-pane__empty">
      {{ t("settings.modelRegistry.empty") }}
    </p>

    <article
      v-for="provider in registry"
      :key="`${provider.env}:${provider.id}`"
      class="model-registry-pane__card"
    >
      <header class="model-registry-pane__card-head">
        <span class="model-registry-pane__provider">{{ provider.id }}</span>
        <span
          class="model-registry-pane__env-pill"
          :class="`model-registry-pane__env-pill--${provider.env}`"
        >
          {{
            provider.env === "local"
              ? t("settings.modelRegistry.local")
              : t("settings.modelRegistry.cloud")
          }}
        </span>
        <span class="model-registry-pane__model-count">
          {{ provider.models.length }}
        </span>
      </header>
      <ul class="model-registry-pane__models">
        <li
          v-for="model in provider.models"
          :key="`${provider.id}-${model.id}`"
          class="model-registry-pane__model-row"
        >
          <span class="model-registry-pane__model-id">{{ model.id }}</span>
          <span v-if="model.roles.length" class="model-registry-pane__model-roles">
            {{ t("settings.modelRegistry.usedBy", { roles: model.roles.join(", ") }) }}
          </span>
          <span v-else class="model-registry-pane__unused">
            {{ t("settings.modelRegistry.unused") }}
          </span>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useI18n } from "@/shared/lib/i18n";
import { useModelRegistry } from "./useModelRegistry";

const { t } = useI18n();
const { registry, loading, errors, onRefresh } = useModelRegistry();
</script>

<style scoped>
.model-registry-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}

.model-registry-pane__toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.model-registry-pane__btn {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
  cursor: pointer;
}

.model-registry-pane__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.model-registry-pane__warn {
  color: var(--ink-3, #999);
  font-size: 12px;
}

.model-registry-pane__empty {
  margin: 0;
  padding: 18px;
  background: var(--card-soft);
  border-radius: var(--r-md);
  color: var(--ink-3);
  font-size: 13px;
}

.model-registry-pane__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.model-registry-pane__card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-registry-pane__provider {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.model-registry-pane__env-pill {
  display: inline-flex;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.model-registry-pane__env-pill--local {
  background: var(--ok-soft, #e6f4ea);
  color: var(--ok, #1e7a3e);
}

.model-registry-pane__env-pill--cloud {
  background: var(--info-soft, #e7f0ff);
  color: var(--info, #1f5fcf);
}

.model-registry-pane__model-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-3);
}

.model-registry-pane__models {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-registry-pane__model-row {
  display: flex;
  gap: 12px;
  padding: 6px 8px;
  border-radius: var(--r-sm);
  background: var(--card-soft);
  font-size: 12px;
}

.model-registry-pane__model-id {
  font-family: var(--font-mono);
  color: var(--ink);
}

.model-registry-pane__model-roles {
  margin-left: auto;
  color: var(--ink-3);
}

.model-registry-pane__unused {
  margin-left: auto;
  color: var(--ink-3, #999);
  font-style: italic;
}
</style>
