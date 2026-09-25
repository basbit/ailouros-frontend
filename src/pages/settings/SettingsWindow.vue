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
    <RestartPendingBanner />
    <component :is="activePaneComponent" />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import AppShell from "@/widgets/app-shell/AppShell.vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import SubNav, { type SubNavEntry } from "@/widgets/app-shell/SubNav.vue";
import ApiKeysPane from "./panes/ApiKeysPane.vue";
import ScenariosPane from "./panes/ScenariosPane.vue";
import ModelRegistryPane from "./panes/ModelRegistryPane.vue";
import AutomationPane from "./panes/AutomationPane.vue";
import FeatureFlagsPane from "./panes/FeatureFlagsPane.vue";
import NotificationsPane from "./panes/NotificationsPane.vue";
import IssueAutopilotPane from "./panes/IssueAutopilotPane.vue";
import RemoteControlPane from "./panes/RemoteControlPane.vue";
import AgenticPane from "./panes/AgenticPane.vue";
import RestartPendingBanner from "@/shared/components/settings-fields/RestartPendingBanner.vue";
import { useSettingFieldFocus } from "./useSettingFieldFocus";
import AboutPane from "./panes/AboutPane.vue";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  pane: string;
}>();

const router = useRouter();
const { t } = useI18n();

const PANES = {
  "api-keys": ApiKeysPane,
  automation: AutomationPane,
  "feature-flags": FeatureFlagsPane,
  notifications: NotificationsPane,
  "issue-autopilot": IssueAutopilotPane,
  "remote-control": RemoteControlPane,
  agentic: AgenticPane,
  scenarios: ScenariosPane,
  "model-registry": ModelRegistryPane,
  about: AboutPane,
} as const;

type PaneKey = keyof typeof PANES;

const PANE_ORDER: PaneKey[] = [
  "api-keys",
  "automation",
  "feature-flags",
  "notifications",
  "issue-autopilot",
  "remote-control",
  "agentic",
  "scenarios",
  "model-registry",
  "about",
];

const SUBNAV_LABELS: Record<PaneKey, string> = {
  "api-keys": "settings.subnav.apiKeys",
  automation: "settings.subnav.automation",
  "feature-flags": "settings.subnav.featureFlags",
  notifications: "settings.subnav.notifications",
  "issue-autopilot": "settings.subnav.issueAutopilot",
  "remote-control": "settings.subnav.remoteControl",
  agentic: "settings.subnav.agentic",
  scenarios: "settings.subnav.scenarios",
  "model-registry": "settings.subnav.modelRegistry",
  about: "settings.subnav.about",
};

const activePane = computed<PaneKey>(() => {
  return (PANE_ORDER as string[]).includes(props.pane)
    ? (props.pane as PaneKey)
    : "api-keys";
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
      void router.replace("/settings/api-keys");
    }
  },
  { immediate: true },
);

useSettingFieldFocus();

function onSelect(key: string): void {
  void router.push(`/settings/${key}`);
}
</script>
