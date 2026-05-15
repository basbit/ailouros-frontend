<template>
  <div ref="rootEl" class="project-switcher">
    <button
      type="button"
      class="project-switcher__trigger"
      :aria-expanded="open"
      :aria-haspopup="true"
      :title="t('projectSwitcher.openShortcut')"
      @click="toggle"
    >
      <span class="project-switcher__trigger-label">{{ t("header.project") }}</span>
      <span class="project-switcher__trigger-value">{{ currentName || "—" }}</span>
      <svg
        class="project-switcher__chevron"
        :class="{ 'project-switcher__chevron--open': open }"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Transition name="project-switcher__pop">
      <ProjectSwitcherList
        v-if="open"
        :filtered-projects="filteredProjects"
        :current-id="currentId"
        :active-index="activeIndex"
        :show-search="showSearch"
        :search-query="searchQuery"
        @select="onSelect"
        @new="onNew"
        @toggle-menu="toggleMenu"
        @active-index="(i) => (activeIndex = i)"
        @update:search-query="(v) => (searchQuery = v)"
        @search-keydown="onSearchKeydown"
        @search-input-ref="(el) => (searchEl = el)"
      />
    </Transition>

    <ProjectSwitcherRowMenu
      :open-menu-id="openMenuId"
      :menu-position="menuPosition"
      :project-count="projectList.length"
      @edit="onEdit"
      @rename="onRename"
      @delete="onDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, toRef } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import ProjectSwitcherList from "./ProjectSwitcherList.vue";
import ProjectSwitcherRowMenu from "./ProjectSwitcherRowMenu.vue";
import { useProjectSwitcherState } from "./useProjectSwitcherState";
// Shared popover/menu CSS lives in a sibling file so the same selectors work
// across ProjectSwitcher, ProjectSwitcherList, and ProjectSwitcherRowMenu
// without requiring :deep() — see project-switcher.css for the rationale.
import "./project-switcher.css";

const props = defineProps<{
  currentId: string;
  projectList: { id: string; name: string }[];
}>();

const emit = defineEmits<{
  change: [id: string];
  new: [];
  rename: [id: string];
  delete: [id: string];
  edit: [id: string];
}>();

const { t } = useI18n();

function emitChange(id: string): void {
  if (id !== props.currentId) emit("change", id);
}

const {
  open,
  searchQuery,
  activeIndex,
  openMenuId,
  menuPosition,
  rootEl,
  searchEl,
  showSearch,
  currentName,
  filteredProjects,
  toggle,
  close,
  toggleMenu,
  onSearchKeydown,
  onGlobalKeydown,
  onGlobalPointerDown,
} = useProjectSwitcherState({
  currentId: toRef(props, "currentId"),
  projectList: toRef(props, "projectList"),
  onSelect: emitChange,
});

function onSelect(id: string): void {
  emitChange(id);
  close();
}

function onNew(): void {
  close();
  emit("new");
}

function onRename(id: string): void {
  close();
  emit("rename", id);
}

function onEdit(id: string): void {
  close();
  emit("edit", id);
}

function onDelete(id: string): void {
  close();
  emit("delete", id);
}

onMounted(() => {
  window.addEventListener("keydown", onGlobalKeydown);
  window.addEventListener("pointerdown", onGlobalPointerDown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  window.removeEventListener("pointerdown", onGlobalPointerDown);
});
</script>

<style scoped>
.project-switcher {
  position: relative;
  display: inline-flex;
}

.project-switcher__trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font);
  color: var(--text);
  transition:
    background 0.15s,
    border-color 0.15s;
}
.project-switcher__trigger:hover,
.project-switcher__trigger[aria-expanded="true"] {
  background: var(--surface2);
  border-color: var(--border);
}
.project-switcher__trigger-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text3);
}
.project-switcher__trigger-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-switcher__chevron {
  color: var(--text3);
  transition: transform 0.18s var(--ease-spring);
}
.project-switcher__chevron--open {
  transform: rotate(180deg);
  color: var(--text2);
}

.project-switcher__pop-enter-active,
.project-switcher__pop-leave-active {
  transition:
    opacity 0.14s var(--ease-spring),
    transform 0.14s var(--ease-spring);
}
.project-switcher__pop-enter-from,
.project-switcher__pop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
  transform-origin: top left;
}
</style>
