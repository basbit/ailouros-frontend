<template>
  <Teleport to="body">
    <div
      v-if="palette.open"
      class="command-palette__backdrop"
      role="presentation"
      @click.self="palette.hide()"
    >
      <div
        class="command-palette__dialog"
        role="dialog"
        :aria-label="t('commandPalette.placeholder')"
      >
        <input
          ref="searchEl"
          v-model="query"
          type="search"
          class="command-palette__input"
          :placeholder="t('commandPalette.placeholder')"
          @keydown.escape.prevent="palette.hide()"
          @keydown.enter.prevent="onSubmit"
          @keydown.down.prevent="onMove(1)"
          @keydown.up.prevent="onMove(-1)"
        />
        <div v-if="groups.length" class="command-palette__results">
          <section
            v-for="group in groups"
            :key="group.key"
            class="command-palette__group"
          >
            <h3 class="command-palette__group-title">{{ group.label }}</h3>
            <button
              v-for="item in group.items"
              :key="item.id"
              type="button"
              class="command-palette__item"
              :class="{
                'command-palette__item--active': item.flatIndex === activeIndex,
              }"
              @mouseenter="activeIndex = item.flatIndex"
              @click="onSelect(item)"
            >
              <span class="command-palette__item-title">{{ item.title }}</span>
              <span class="command-palette__item-hint">{{ item.hint }}</span>
            </button>
          </section>
        </div>
        <p v-else class="command-palette__empty">
          {{ t("commandPalette.empty") }}
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useCommandPaletteStore } from "@/shared/store/command-palette";
import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";
import { formatRelativeShort } from "@/shared/lib/format-relative";

interface PaletteItem {
  id: string;
  title: string;
  hint: string;
  target: string;
  flatIndex: number;
}

interface PaletteGroup {
  key: string;
  label: string;
  items: PaletteItem[];
}

const palette = useCommandPaletteStore();
const ui = useUiStore();
const router = useRouter();
const { t } = useI18n();

const query = ref("");
const activeIndex = ref(0);
const searchEl = ref<HTMLInputElement | null>(null);

const NAV_ITEMS: Array<{ id: string; titleKey: string; hint: string; target: string }> =
  [
    { id: "nav-run", titleKey: "header.tabs.run", hint: "⌘ ↵", target: "/run" },
    {
      id: "nav-configure",
      titleKey: "header.tabs.configure",
      hint: "",
      target: "/configure",
    },
    {
      id: "nav-history",
      titleKey: "header.tabs.history",
      hint: "",
      target: "/history",
    },
    {
      id: "nav-settings",
      titleKey: "settings.title",
      hint: "⌘ ,",
      target: "/settings",
    },
  ];

const SETTINGS_ITEMS: Array<{ id: string; titleKey: string; target: string }> = [
  {
    id: "set-profile",
    titleKey: "settings.subnav.profile",
    target: "/settings/profile",
  },
  {
    id: "set-apikeys",
    titleKey: "settings.subnav.apiKeys",
    target: "/settings/api-keys",
  },
  {
    id: "set-automation",
    titleKey: "settings.subnav.automation",
    target: "/settings/automation",
  },
  {
    id: "set-notifications",
    titleKey: "settings.subnav.notifications",
    target: "/settings/notifications",
  },
  {
    id: "set-scenarios",
    titleKey: "settings.subnav.scenarios",
    target: "/settings/scenarios",
  },
  {
    id: "set-model-registry",
    titleKey: "settings.subnav.modelRegistry",
    target: "/settings/model-registry",
  },
  {
    id: "set-appearance",
    titleKey: "settings.subnav.appearance",
    target: "/settings/appearance",
  },
  {
    id: "set-shortcuts",
    titleKey: "settings.subnav.shortcuts",
    target: "/settings/shortcuts",
  },
];

function matches(haystack: string, term: string): boolean {
  if (!term) return true;
  return haystack.toLowerCase().includes(term);
}

const groups = computed<PaletteGroup[]>(() => {
  const term = query.value.trim().toLowerCase();
  let flat = 0;

  const navItems: PaletteItem[] = NAV_ITEMS.filter((item) =>
    matches(t(item.titleKey), term),
  ).map((item) => ({
    id: item.id,
    title: t(item.titleKey),
    hint: item.hint,
    target: item.target,
    flatIndex: flat++,
  }));

  const settingsItems: PaletteItem[] = SETTINGS_ITEMS.filter((item) =>
    matches(t(item.titleKey), term),
  ).map((item) => ({
    id: item.id,
    title: t(item.titleKey),
    hint: "",
    target: item.target,
    flatIndex: flat++,
  }));

  const runItems: PaletteItem[] = ui.historyList
    .filter((entry) => matches(entry.prompt ?? "", term))
    .slice(0, 8)
    .map((entry) => ({
      id: `run-${entry.id}`,
      title: (entry.prompt ?? entry.id).split("\n")[0],
      hint: t("commandPalette.runMeta", {
        steps: entry.pipeline_steps?.length ?? 0,
        when: formatRelativeShort(entry.startedAt ?? entry.at),
      }),
      target: `/history/${entry.id}`,
      flatIndex: flat++,
    }));

  const result: PaletteGroup[] = [];
  if (navItems.length) {
    result.push({
      key: "nav",
      label: t("commandPalette.group.navigation"),
      items: navItems,
    });
  }
  if (settingsItems.length) {
    result.push({
      key: "settings",
      label: t("commandPalette.group.settings"),
      items: settingsItems,
    });
  }
  if (runItems.length) {
    result.push({
      key: "runs",
      label: t("commandPalette.group.runs"),
      items: runItems,
    });
  }
  return result;
});

const flatItems = computed<PaletteItem[]>(() =>
  groups.value.flatMap((group) => group.items),
);

watch(
  () => palette.open,
  async (open) => {
    if (open) {
      query.value = "";
      activeIndex.value = 0;
      await nextTick();
      searchEl.value?.focus();
    }
  },
);

watch(flatItems, () => {
  activeIndex.value = 0;
});

function onMove(delta: number): void {
  const total = flatItems.value.length;
  if (!total) return;
  activeIndex.value = (activeIndex.value + delta + total) % total;
}

function onSelect(item: PaletteItem): void {
  void router.push(item.target);
  palette.hide();
}

function onSubmit(): void {
  const item = flatItems.value[activeIndex.value];
  if (!item) return;
  onSelect(item);
}
</script>

<style scoped>
.command-palette__backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 18vh;
}

.command-palette__dialog {
  width: min(640px, calc(100vw - 32px));
  max-height: 60vh;
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.command-palette__input {
  appearance: none;
  width: 100%;
  padding: 14px 18px;
  border: none;
  border-bottom: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
  font-size: 15px;
}

.command-palette__input:focus {
  outline: none;
}

.command-palette__results {
  overflow-y: auto;
  padding: 6px 6px 10px;
}

.command-palette__group {
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.command-palette__group-title {
  margin: 6px 8px 4px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-4);
}

.command-palette__item {
  appearance: none;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 8px 12px;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.command-palette__item-title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-palette__item-hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
}

.command-palette__item--active {
  background: var(--accent-soft);
  color: var(--ink);
}

.command-palette__item--active .command-palette__item-hint {
  color: var(--accent-2);
}

.command-palette__empty {
  margin: 24px 16px;
  text-align: center;
  color: var(--ink-4);
  font-size: 13px;
}
</style>
