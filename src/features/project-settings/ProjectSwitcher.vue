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
      <div
        v-if="open"
        class="project-switcher__popover"
        role="dialog"
        :aria-label="t('project.title')"
      >
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
            ref="searchEl"
            v-model="searchQuery"
            type="text"
            class="project-switcher__search-input"
            :placeholder="t('projectSwitcher.searchPlaceholder')"
            @keydown="onSearchKeydown"
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
            @mouseenter="activeIndex = i"
            @click="onSelect(p.id)"
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
            <span class="project-switcher__item-name" :title="p.name">{{
              p.name
            }}</span>
            <button
              type="button"
              class="project-switcher__kebab"
              :title="t('projectSwitcher.rowActions')"
              :aria-label="t('projectSwitcher.rowActions')"
              @click.stop="toggleMenu(p.id, $event)"
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

        <button type="button" class="project-switcher__new" @click="onNew">
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
    </Transition>

    <Teleport to="body">
      <div
        v-if="openMenuId && menuPosition"
        class="project-switcher__menu project-switcher__menu--floating"
        :style="menuPosition"
        role="menu"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="project-switcher__menu-item"
          @click="onEdit(openMenuId)"
        >
          {{ t("projectSwitcher.edit") }}
        </button>
        <button
          type="button"
          role="menuitem"
          class="project-switcher__menu-item"
          @click="onRename(openMenuId)"
        >
          {{ t("project.rename") }}
        </button>
        <button
          type="button"
          role="menuitem"
          class="project-switcher__menu-item project-switcher__menu-item--danger"
          :disabled="projectList.length <= 1"
          @click="onDelete(openMenuId)"
        >
          {{ t("project.delete") }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";

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

const open = ref(false);
const searchQuery = ref("");
const activeIndex = ref(0);
const openMenuId = ref<string | null>(null);
const menuPosition = ref<{ top: string; left: string } | null>(null);
const rootEl = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);

const showSearch = computed(() => props.projectList.length > 5);

const currentName = computed(
  () => props.projectList.find((p) => p.id === props.currentId)?.name ?? "",
);

const filteredProjects = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.projectList;
  return props.projectList.filter((p) => p.name.toLowerCase().includes(q));
});

watch(filteredProjects, () => {
  if (activeIndex.value >= filteredProjects.value.length) {
    activeIndex.value = Math.max(0, filteredProjects.value.length - 1);
  }
});

function toggle(): void {
  if (open.value) {
    close();
  } else {
    openPopover();
  }
}

function openPopover(): void {
  open.value = true;
  openMenuId.value = null;
  menuPosition.value = null;
  searchQuery.value = "";
  const idx = props.projectList.findIndex((p) => p.id === props.currentId);
  activeIndex.value = idx >= 0 ? idx : 0;
  nextTick(() => {
    if (showSearch.value) searchEl.value?.focus();
  });
}

function close(): void {
  open.value = false;
  openMenuId.value = null;
  menuPosition.value = null;
}

function onSelect(id: string): void {
  if (id !== props.currentId) emit("change", id);
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

function toggleMenu(id: string, e?: MouseEvent): void {
  if (openMenuId.value === id) {
    openMenuId.value = null;
    menuPosition.value = null;
    return;
  }
  const kebab = (e?.currentTarget as HTMLElement | undefined) ?? null;
  if (kebab) {
    const rect = kebab.getBoundingClientRect();
    // Anchor menu below-right of the kebab; menu is 140px wide, offset so its
    // right edge aligns with the kebab's right edge for a tidy popover.
    const menuWidth = 140;
    const top = rect.bottom + 4;
    const left = Math.max(8, rect.right - menuWidth);
    menuPosition.value = { top: `${top}px`, left: `${left}px` };
  }
  openMenuId.value = id;
}

function onSearchKeydown(e: KeyboardEvent): void {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = Math.min(
      activeIndex.value + 1,
      filteredProjects.value.length - 1,
    );
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const p = filteredProjects.value[activeIndex.value];
    if (p) onSelect(p.id);
  }
}

function onGlobalKeydown(e: KeyboardEvent): void {
  // Cmd+P / Ctrl+P — toggle switcher
  if (
    (e.metaKey || e.ctrlKey) &&
    e.key.toLowerCase() === "p" &&
    !e.shiftKey &&
    !e.altKey
  ) {
    e.preventDefault();
    toggle();
    return;
  }
  if (!open.value) return;
  if (e.key === "Escape") {
    e.preventDefault();
    close();
  } else if (e.key === "ArrowDown" && !showSearch.value) {
    e.preventDefault();
    activeIndex.value = Math.min(
      activeIndex.value + 1,
      filteredProjects.value.length - 1,
    );
  } else if (e.key === "ArrowUp" && !showSearch.value) {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (e.key === "Enter" && !showSearch.value) {
    e.preventDefault();
    const p = filteredProjects.value[activeIndex.value];
    if (p) onSelect(p.id);
  }
}

function onGlobalPointerDown(e: PointerEvent): void {
  if (!open.value) return;
  const target = e.target as HTMLElement | null;
  if (!target) return;
  // Teleported menu lives under <body>, not under rootEl — don't close on its clicks.
  if (target.closest(".project-switcher__menu--floating")) return;
  if (rootEl.value && !rootEl.value.contains(target)) close();
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

.project-switcher__popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 320px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.12);
  z-index: 200;
  overflow: hidden;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-switcher__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text3);
  margin-bottom: 4px;
}
.project-switcher__search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font);
  font-size: 13px;
}

.project-switcher__list {
  display: flex;
  flex-direction: column;
  min-height: 60px;
  max-height: 320px;
  overflow-y: auto;
}

.project-switcher__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--text);
  font-size: 13px;
  user-select: none;
}
.project-switcher__item--active {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}
.project-switcher__item--current .project-switcher__item-name {
  font-weight: 600;
}
.project-switcher__item-check {
  width: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}
.project-switcher__item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-switcher__kebab {
  background: transparent;
  border: none;
  color: var(--text3);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  opacity: 0;
  transition:
    opacity 0.15s,
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
}
.project-switcher__item:hover .project-switcher__kebab,
.project-switcher__item--active .project-switcher__kebab {
  opacity: 1;
}
.project-switcher__kebab:hover {
  background: var(--surface2);
  color: var(--text);
}

.project-switcher__menu {
  min-width: 140px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
/* Teleported variant — lives under <body>, uses inline top/left from JS. */
.project-switcher__menu--floating {
  position: fixed;
  z-index: 300;
}
.project-switcher__menu-item {
  text-align: left;
  background: transparent;
  border: none;
  padding: 7px 10px;
  border-radius: 6px;
  font-family: var(--font);
  font-size: 12.5px;
  color: var(--text);
  cursor: pointer;
}
.project-switcher__menu-item:hover:not(:disabled) {
  background: var(--surface2);
}
.project-switcher__menu-item:disabled {
  color: var(--text3);
  cursor: not-allowed;
}
.project-switcher__menu-item--danger {
  color: var(--error);
}
.project-switcher__menu-item--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--error) 12%, transparent);
}

.project-switcher__empty {
  padding: 16px 12px;
  text-align: center;
  color: var(--text3);
  font-size: 12px;
}

.project-switcher__new {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  margin-top: 4px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: var(--radius);
  color: var(--text);
  font-weight: 600;
  font-size: 13px;
  font-family: var(--font);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.project-switcher__new:hover {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
}
.project-switcher__new span[aria-hidden] {
  color: var(--accent);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
}

.project-switcher__footer {
  display: flex;
  gap: 8px;
  padding: 10px 10px 6px;
  margin-top: 4px;
  border-top: 1px solid var(--border);
  color: var(--text3);
  font-size: 11px;
  line-height: 1.5;
}
.project-switcher__footer svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.project-switcher__shortcut-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 6px;
  font-size: 10.5px;
  color: var(--text3);
}
.project-switcher__shortcut-hint kbd {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--surface2);
  border: 1px solid var(--border);
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
