<template>
  <div class="project-switcher__popover" role="dialog" :aria-label="t('project.title')">
    <div v-if="showSearch" class="project-switcher__search">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref="searchInput"
        :value="searchQuery"
        type="text"
        class="project-switcher__search-input"
        :placeholder="t('projectSwitcher.searchPlaceholder')"
        @input="onSearchInput"
        @keydown="$emit('search-keydown', $event)"
      />
    </div>

    <div class="project-switcher__list" role="listbox">
      <div
        v-for="(p, i) in filteredProjects"
        :key="p.id"
        role="option"
        class="project-switcher__item"
        :class="{
          'project-switcher__item--active': i === activeIndex,
          'project-switcher__item--current': p.id === currentId,
        }"
        :aria-selected="p.id === currentId"
        @mouseenter="$emit('active-index', i)"
        @click="$emit('select', p.id)"
      >
        <span class="project-switcher__item-check">
          <svg
            v-if="p.id === currentId"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span class="project-switcher__item-name" :title="p.name">{{ p.name }}</span>
        <button
          type="button"
          class="project-switcher__kebab"
          :title="t('projectSwitcher.rowActions')"
          :aria-label="t('projectSwitcher.rowActions')"
          @click.stop="$emit('toggle-menu', p.id, $event)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      <div v-if="!filteredProjects.length" class="project-switcher__empty">
        {{ t("projectSwitcher.empty") }}
      </div>
    </div>

    <button type="button" class="project-switcher__new" @click="$emit('new')">
      <span aria-hidden="true">+</span>
      {{ t("project.new") }}
    </button>

    <div class="project-switcher__footer">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="16" y2="12" />
        <line x1="12" x2="12.01" y1="8" y2="8" />
      </svg>
      <span>{{ t("project.scope") }}</span>
    </div>

    <div class="project-switcher__shortcut-hint">
      <kbd>⌘</kbd><kbd>P</kbd>
      <span>{{ t("projectSwitcher.shortcutHint") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";

interface SwitcherProject {
  id: string;
  name: string;
}

defineProps<{
  filteredProjects: SwitcherProject[];
  currentId: string;
  activeIndex: number;
  showSearch: boolean;
  searchQuery: string;
}>();

const emit = defineEmits<{
  select: [id: string];
  new: [];
  "toggle-menu": [id: string, ev: MouseEvent];
  "active-index": [i: number];
  "update:search-query": [value: string];
  "search-keydown": [ev: KeyboardEvent];
  "search-input-ref": [el: HTMLInputElement | null];
}>();

const { t } = useI18n();
const searchInput = ref<HTMLInputElement | null>(null);

watch(
  searchInput,
  (el) => {
    emit("search-input-ref", el);
  },
  { immediate: true },
);

function onSearchInput(ev: Event): void {
  const target = ev.target as HTMLInputElement;
  emit("update:search-query", target.value);
}
</script>
