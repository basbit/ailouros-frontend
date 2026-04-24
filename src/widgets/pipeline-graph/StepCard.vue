<template>
  <div
    class="step-card"
    :class="cardClass"
    :title="nodeTypeLabel"
    :data-step-id="stepId"
  >
    <span v-if="editable" class="step-drag-handle" title="Drag to reorder">⠿</span>
    <button
      v-if="editable"
      class="step-remove-btn"
      title="Remove step"
      @pointerdown.stop
      @click.stop="$emit('remove')"
    >
      ×
    </button>
    <!-- Node type indicator (shape accent) -->
    <span
      class="step-type-pip"
      :class="`step-type-pip--${nodeType}`"
      :aria-label="nodeTypeLabel"
    />
    <span class="step-icon" :class="{ 'step-icon--bob': status === 'in_progress' }">
      <AgentIcon :agent="stepId" :size="20" />
    </span>
    <select
      v-if="editable && options"
      class="step-select"
      :value="stepId"
      @change="$emit('change', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="[val, lbl] in options" :key="val" :value="val">{{ lbl }}</option>
    </select>
    <span v-else class="step-name">{{ label }}</span>
    <span class="step-badge">
      <template v-if="status === 'in_progress'">
        <span class="dots"
          ><span class="dot dot-1">●</span><span class="dot dot-2">●</span
          ><span class="dot dot-3">●</span></span
        >
      </template>
      <template v-else-if="status === 'completed'"
        ><span class="badge-done">✓</span></template
      >
      <template v-else-if="status === 'failed'"
        ><span class="badge-fail">✗</span></template
      >
      <template v-else-if="status === 'skipped'"
        ><span class="badge-skip">⚡</span></template
      >
      <template v-else-if="status === 'retrying'"
        ><span class="badge-retry">↻</span></template
      >
      <template v-else-if="status === 'blocked'"
        ><span class="badge-blocked">⛔</span></template
      >
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AgentIcon from "@/shared/ui/AgentIcon.vue";
// §10.5: single source of truth for node taxonomy — shared with
// PipelineSummary.vue and step-summarisation utilities. Do NOT duplicate
// the map here; prior duplication led to drift when new step ids landed.
import { classifyStep, type NodeType } from "@/shared/lib/step-taxonomy";

export type { NodeType };

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  agent: "Agent",
  reviewer: "Reviewer",
  verification: "Verification",
  human_gate: "Human Gate",
  tool_preflight: "Tool / Preflight",
  join_branch: "Join / Branch",
};

const props = defineProps<{
  stepId: string;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "failed"
    | "skipped"
    | "retrying"
    | "blocked";
  editable?: boolean;
  options?: [string, string][];
  parallel?: boolean;
}>();

defineEmits<{
  remove: [];
  change: [val: string];
}>();

const label = computed(() =>
  props.stepId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
);

/** Resolve node type via shared taxonomy (see step-taxonomy.ts). */
const nodeType = computed((): NodeType => classifyStep(props.stepId));

const nodeTypeLabel = computed(() => NODE_TYPE_LABELS[nodeType.value]);

const cardClass = computed(() => ({
  [`step-card--${props.status}`]: true,
  [`step-card--type-${nodeType.value}`]: true,
  "step-card--parallel-sibling": !!props.parallel,
}));
</script>

<!-- Styles extracted to sibling StepCard.css (scoped preserved via src attr). -->
<style scoped src="./StepCard.css"></style>
