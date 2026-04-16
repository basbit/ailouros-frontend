<template>
  <div class="step-card" :class="cardClass" :title="nodeTypeLabel">
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
    <span class="step-emoji" :class="{ 'step-emoji--bob': status === 'in_progress' }">
      {{ emoji }}
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
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { walkerEmojiForAgent } from "@/widgets/task-monitor/useTaskMonitor";
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
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  editable?: boolean;
  options?: [string, string][];
  parallel?: boolean;
}>();

defineEmits<{
  remove: [];
  change: [val: string];
}>();

const emoji = computed(() => walkerEmojiForAgent(props.stepId, null));
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

<style scoped>
/* ── Node type pip (top-left corner accent) ──────────────────── */
.step-type-pip {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  opacity: 0.85;
}
.step-type-pip--agent {
  background: #4dabf7;
}
.step-type-pip--reviewer {
  background: #f59f00;
  border-radius: 2px;
}
.step-type-pip--verification {
  background: #40c057;
  border-radius: 1px;
}
.step-type-pip--human_gate {
  background: #cc5de8;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  border-radius: 0;
}
.step-type-pip--tool_preflight {
  background: #74c0fc;
  border-radius: 0;
}
.step-type-pip--join_branch {
  background: #a9e34b;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  border-radius: 0;
}

/* ── Node type border accents (when NOT in status-specific state) ── */
:deep(.step-card--pending.step-card--type-reviewer) {
  border-color: rgba(245, 159, 0, 0.35);
}
:deep(.step-card--pending.step-card--type-verification) {
  border-color: rgba(64, 192, 87, 0.35);
}
:deep(.step-card--pending.step-card--type-human_gate) {
  border-color: rgba(204, 93, 232, 0.35);
}
:deep(.step-card--pending.step-card--type-join_branch) {
  border-color: rgba(169, 227, 75, 0.35);
}
:deep(.step-card--pending.step-card--type-tool_preflight) {
  border-color: rgba(116, 192, 252, 0.35);
}
</style>
