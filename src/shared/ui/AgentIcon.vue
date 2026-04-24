<template>
  <!--
    v-html renders `svgInner`, which comes from the static `AGENT_ICON_PATHS`
    map (lucide SVG inner markup). The content is compiled into the bundle
    and never reflects user input, so there is no XSS surface here — the
    ``vue/no-v-html`` rule is relaxed for this file in ``eslint.config.js``.
  -->
  <svg
    class="agent-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-label="agent"
    role="img"
    v-html="svgInner"
  ></svg>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AGENT_ICON_PATHS, agentIconKey } from "@/shared/lib/agent-icon";

const props = withDefaults(
  defineProps<{
    agent: string;
    taskStatus?: string | null;
    size?: number;
  }>(),
  { size: 20, taskStatus: null },
);

const svgInner = computed(
  () => AGENT_ICON_PATHS[agentIconKey(props.agent, props.taskStatus)],
);
</script>

<style scoped>
.agent-icon {
  display: block;
  flex-shrink: 0;
}
</style>
