<template>
  <div
    class="step-card"
    :class="cardClass"
    :title="orderViolation ?? nodeTypeLabel"
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
    <span
      class="step-type-pip"
      :class="`step-type-pip--${nodeType}`"
      :aria-label="nodeTypeLabel"
    />
    <span class="step-icon" :class="{ 'step-icon--bob': status === 'in_progress' }">
      <AgentIcon :agent="stepId" :size="20" />
    </span>
    <button
      v-if="editable && options"
      type="button"
      class="step-role-button"
      :title="t('rolePicker.openLabel')"
      @click.stop="pickerOpen = true"
    >
      <span class="step-role-button__label">{{ activeOptionLabel }}</span>
      <span class="step-role-button__chevron">▾</span>
    </button>
    <span v-else class="step-name">{{ label }}</span>
    <RolePickerPopover
      v-if="editable && options"
      :open="pickerOpen"
      :model-value="stepId"
      :roles="roleSummaries"
      @update:model-value="onPickRole"
      @close="pickerOpen = false"
    />
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
import { computed, ref } from "vue";
import AgentIcon from "@/shared/ui/AgentIcon.vue";
import RolePickerPopover from "@/shared/ui/RolePickerPopover.vue";
import { useI18n } from "@/shared/lib/i18n";
// §10.5: single source of truth for node taxonomy — shared with
// PipelineSummary.vue and step-summarisation utilities. Do NOT duplicate
import { classifyStep, type NodeType } from "@/shared/lib/step-taxonomy";

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
  orderViolation?: string;
}>();

const label = computed(() =>
  props.stepId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
);

const nodeType = computed((): NodeType => classifyStep(props.stepId));

const nodeTypeLabel = computed(() => NODE_TYPE_LABELS[nodeType.value]);

const cardClass = computed(() => ({
  [`step-card--${props.status}`]: true,
  [`step-card--type-${nodeType.value}`]: true,
  "step-card--parallel-sibling": !!props.parallel,
  "step-card--order-violation": !!props.orderViolation,
}));

const { t } = useI18n();
const pickerOpen = ref(false);

const emit = defineEmits<{
  remove: [];
  change: [val: string];
}>();

const activeOptionLabel = computed(() => {
  const match = props.options?.find(([val]) => val === props.stepId);
  return match ? match[1] : label.value;
});

const roleSummaries = computed(() => {
  if (!props.options) return [];
  return props.options.map(([id, title]) => ({
    id,
    title,
    summary: NODE_TYPE_LABELS[classifyStep(id)],
    skills: [] as string[],
  }));
});

function onPickRole(value: string): void {
  emit("change", value);
}
</script>

<!-- Styles extracted to sibling StepCard.css (scoped preserved via src attr). -->
<style scoped src="./StepCard.css"></style>
