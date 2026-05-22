<template>
  <AppShell>
    <template #header>
      <AppHeaderContainer />
    </template>
    <template #subnav>
      <SubNav
        :entries="entries"
        :active="activePane"
        :label="t('header.tabs.settings')"
        @select="onSelect"
      />
    </template>
    <component :is="activePaneComponent" />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import AppShell from "@/widgets/app-shell/AppShell.vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import SubNav, { type SubNavEntry } from "@/widgets/app-shell/SubNav.vue";
import ProfilePane from "./panes/ProfilePane.vue";
import ApiKeysPane from "./panes/ApiKeysPane.vue";
import ScenariosPane from "./panes/ScenariosPane.vue";
import ModelRegistryPane from "./panes/ModelRegistryPane.vue";
import AutomationPane from "./panes/AutomationPane.vue";
import NotificationsPane from "./panes/NotificationsPane.vue";
import AboutPane from "./panes/AboutPane.vue";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  pane: string;
}>();

const router = useRouter();
const { t } = useI18n();

const PANES = {
  profile: ProfilePane,
  "api-keys": ApiKeysPane,
  automation: AutomationPane,
  notifications: NotificationsPane,
  scenarios: ScenariosPane,
  "model-registry": ModelRegistryPane,
  about: AboutPane,
} as const;

type PaneKey = keyof typeof PANES;

const PANE_ORDER: PaneKey[] = [
  "profile",
  "api-keys",
  "automation",
  "notifications",
  "scenarios",
  "model-registry",
  "about",
];

const SUBNAV_LABELS: Record<PaneKey, string> = {
  profile: "settings.subnav.profile",
  "api-keys": "settings.subnav.apiKeys",
  automation: "settings.subnav.automation",
  notifications: "settings.subnav.notifications",
  scenarios: "settings.subnav.scenarios",
  "model-registry": "settings.subnav.modelRegistry",
  about: "settings.subnav.about",
};

const activePane = computed<PaneKey>(() => {
  return (PANE_ORDER as string[]).includes(props.pane)
    ? (props.pane as PaneKey)
    : "profile";
});

const activePaneComponent = computed(() => PANES[activePane.value]);

const entries = computed<SubNavEntry[]>(() =>
  PANE_ORDER.map((key) => ({
    key,
    label: t(SUBNAV_LABELS[key]),
  })),
);

watch(
  () => props.pane,
  (next) => {
    if (!(PANE_ORDER as string[]).includes(next)) {
      void router.replace("/settings/profile");
    }
  },
  { immediate: true },
);

function onSelect(key: string): void {
  void router.push(`/settings/${key}`);
}
</script>
