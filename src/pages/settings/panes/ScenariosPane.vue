<template>
  <section class="scenarios-pane">
    <PaneHeader
      :title="t('settings.scenarios.title')"
      :subtitle="t('settings.scenarios.subtitle')"
    >
      <template #actions>
        <input
          v-model="searchQuery"
          type="search"
          class="scenarios-pane__search"
          :placeholder="t('settings.scenarios.searchPlaceholder')"
        />
        <button type="button" class="scenarios-pane__new" @click="onNew">
          {{ t("settings.scenarios.newButton") }}
        </button>
      </template>
    </PaneHeader>

    <div class="scenarios-pane__filters">
      <button
        v-for="option in filters"
        :key="option.key"
        type="button"
        class="scenarios-pane__filter"
        :class="{ 'scenarios-pane__filter--active': filter === option.key }"
        @click="filter = option.key"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="filteredCards.length" class="scenarios-pane__grid">
      <article
        v-for="card in filteredCards"
        :key="card.id"
        class="scenarios-pane__card"
        :class="{ 'is-selected': card.id === selectedScenarioId }"
        role="button"
        tabindex="0"
        @click="onSelect(card.id)"
        @keydown.enter="onSelect(card.id)"
        @keydown.space.prevent="onSelect(card.id)"
      >
        <header class="scenarios-pane__card-head">
          <span class="scenarios-pane__card-title">{{ card.title }}</span>
          <span v-if="card.custom" class="scenarios-pane__card-badge">
            {{ t("settings.scenarios.filterCustom") }}
          </span>
        </header>
        <p v-if="card.description" class="scenarios-pane__card-description">
          {{ card.description }}
        </p>
        <span class="scenarios-pane__card-steps">
          {{ t("settings.scenarios.steps", { count: card.steps }) }}
        </span>
        <div class="scenarios-pane__card-actions" @click.stop>
          <button
            type="button"
            class="scenarios-pane__card-btn"
            @click="card.custom ? onEdit(card.id) : onEditAsClone(card.id, card.title)"
          >
            {{ t("settings.scenarios.editButton") }}
          </button>
          <button
            v-if="!card.custom"
            type="button"
            class="scenarios-pane__card-btn"
            @click="onCloneAs(card.id, card.title)"
          >
            {{ t("settings.scenarios.cloneAsButton") }}
          </button>
          <button
            v-if="card.custom"
            type="button"
            class="scenarios-pane__card-btn scenarios-pane__card-btn--danger"
            @click="onDelete(card.id, card.title)"
          >
            {{ t("settings.scenarios.deleteButton") }}
          </button>
        </div>
      </article>
    </div>
    <p v-else class="scenarios-pane__empty">{{ t("settings.scenarios.empty") }}</p>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useScenariosPaneCards } from "./useScenariosPaneCards";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

const {
  searchQuery,
  filter,
  filters,
  filteredCards,
  selectedScenarioId,
  onSelect,
  onNew,
  onEdit,
  onCloneAs,
  onEditAsClone,
  onDelete,
} = useScenariosPaneCards(t);
</script>

<style scoped>
.scenarios-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scenarios-pane__search {
  appearance: none;
  width: 280px;
  padding: 7px 12px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
}

.scenarios-pane__search:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.scenarios-pane__new {
  appearance: none;
  padding: 7px 14px;
  border-radius: var(--r-md);
  border: 1px solid transparent;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.scenarios-pane__new:hover {
  filter: brightness(1.05);
}

.scenarios-pane__filters {
  display: flex;
  gap: 6px;
}

.scenarios-pane__filter {
  appearance: none;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.scenarios-pane__filter:hover {
  border-color: var(--line-strong);
}

.scenarios-pane__filter--active {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}

.scenarios-pane__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.scenarios-pane__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  cursor: pointer;
  transition:
    border-color 0.14s,
    transform 0.14s;
}

.scenarios-pane__card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.scenarios-pane__card.is-selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft, rgba(80, 130, 255, 0.18));
}

.scenarios-pane__card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.scenarios-pane__card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.scenarios-pane__card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.scenarios-pane__card-badge {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent-2);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 2px 8px;
}

.scenarios-pane__card-description {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}

.scenarios-pane__card-steps {
  font-size: 11px;
  color: var(--ink-4);
  font-family: var(--font-mono);
}

.scenarios-pane__card-actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.scenarios-pane__card-btn {
  appearance: none;
  padding: 4px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink-2);
  font-size: 11px;
  cursor: pointer;
}

.scenarios-pane__card-btn:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.scenarios-pane__card-btn--danger:hover {
  background: color-mix(in srgb, var(--error) 8%, transparent);
  border-color: var(--error);
  color: var(--error);
}

.scenarios-pane__empty {
  margin: 0;
  padding: 24px 12px;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}
</style>
