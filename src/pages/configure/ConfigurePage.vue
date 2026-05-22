<template>
  <AppShell>
    <template #header>
      <AppHeaderContainer />
    </template>
    <template #subnav>
      <SubNav
        :entries="entries"
        :active="activePane"
        :label="t('header.tabs.configure')"
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
import SubNav, { type SubNavEntry } from "@/widgets/app-shell/SubNav.vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import ProjectPane from "./panes/ProjectPane.vue";
import PipelinePane from "./panes/PipelinePane.vue";
import ModelsPane from "./panes/ModelsPane.vue";
import MemoryPane from "./panes/MemoryPane.vue";
import McpPane from "./panes/McpPane.vue";
import VisualQaPane from "./panes/VisualQaPane.vue";
import AdvancedPane from "./panes/AdvancedPane.vue";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  pane: string;
}>();

const router = useRouter();
const { t } = useI18n();

const PANES = {
  project: ProjectPane,
  pipeline: PipelinePane,
  models: ModelsPane,
  memory: MemoryPane,
  mcp: McpPane,
  "visual-qa": VisualQaPane,
  advanced: AdvancedPane,
} as const;

type PaneKey = keyof typeof PANES;

const PANE_ORDER: PaneKey[] = [
  "project",
  "pipeline",
  "models",
  "memory",
  "mcp",
  "visual-qa",
  "advanced",
];

const SUBNAV_LABELS: Record<PaneKey, string> = {
  project: "configure.subnav.project",
  pipeline: "configure.subnav.pipeline",
  models: "configure.subnav.models",
  memory: "configure.subnav.memory",
  mcp: "configure.subnav.mcp",
  "visual-qa": "configure.subnav.visualQa",
  advanced: "configure.subnav.advanced",
};

const activePane = computed<PaneKey>(() => {
  return (PANE_ORDER as string[]).includes(props.pane)
    ? (props.pane as PaneKey)
    : "project";
});

watch(
  () => props.pane,
  (next) => {
    if (!(PANE_ORDER as string[]).includes(next)) {
      void router.replace("/configure/project");
    }
  },
  { immediate: true },
);

const activePaneComponent = computed(() => PANES[activePane.value]);

const entries = computed<SubNavEntry[]>(() =>
  PANE_ORDER.map((key) => ({
    key,
    label: t(SUBNAV_LABELS[key]),
  })),
);

function onSelect(key: string): void {
  void router.push(`/configure/${key}`);
}
</script>
