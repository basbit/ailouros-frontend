import { computed, nextTick, ref, watch, type Ref } from "vue";

interface SwitcherProject {
  id: string;
  name: string;
}

interface UseProjectSwitcherStateOptions {
  currentId: Ref<string>;
  projectList: Ref<SwitcherProject[]>;
  onSelect: (id: string) => void;
}

export function useProjectSwitcherState(opts: UseProjectSwitcherStateOptions) {
  const open = ref(false);
  const searchQuery = ref("");
  const activeIndex = ref(0);
  const openMenuId = ref<string | null>(null);
  const menuPosition = ref<{ top: string; left: string } | null>(null);
  const rootEl = ref<HTMLElement | null>(null);
  const searchEl = ref<HTMLInputElement | null>(null);

  const showSearch = computed(() => opts.projectList.value.length > 5);

  const currentName = computed(
    () => opts.projectList.value.find((p) => p.id === opts.currentId.value)?.name ?? "",
  );

  const filteredProjects = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return opts.projectList.value;
    return opts.projectList.value.filter((p) => p.name.toLowerCase().includes(q));
  });

  watch(filteredProjects, () => {
    if (activeIndex.value >= filteredProjects.value.length) {
      activeIndex.value = Math.max(0, filteredProjects.value.length - 1);
    }
  });

  function openPopover(): void {
    open.value = true;
    openMenuId.value = null;
    menuPosition.value = null;
    searchQuery.value = "";
    const idx = opts.projectList.value.findIndex((p) => p.id === opts.currentId.value);
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

  function toggle(): void {
    if (open.value) close();
    else openPopover();
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
      if (p) {
        opts.onSelect(p.id);
        close();
      }
    }
  }

  function onGlobalKeydown(e: KeyboardEvent): void {
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
      if (p) {
        opts.onSelect(p.id);
        close();
      }
    }
  }

  function onGlobalPointerDown(e: PointerEvent): void {
    if (!open.value) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(".project-switcher__menu--floating")) return;
    if (rootEl.value && !rootEl.value.contains(target)) close();
  }

  return {
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
    openPopover,
    close,
    toggleMenu,
    onSearchKeydown,
    onGlobalKeydown,
    onGlobalPointerDown,
  };
}
