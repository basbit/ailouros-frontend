<template>
  <div
    class="pipeline-run-card"
    :class="{
      'pipeline-run-card--active': isSelected,
      'pipeline-run-card--compact': compact,
      'attention-required--glow': isAttentionRequired,
    }"
    @click="emit('select', taskId)"
  >
    <div class="pipeline-run-card__header">
      <div class="pipeline-run-card__meta">
        <span
          class="pipeline-run-card__status-dot"
          :class="`pipeline-run-card__status-dot--${statusClass}`"
        />
        <span class="pipeline-run-card__id" :title="taskId">{{ taskId }}</span>
      </div>
      <span
        class="pipeline-run-card__status-badge"
        :class="`pipeline-run-card__status-badge--${statusClass}`"
      >
        {{ statusLabel }}
      </span>
    </div>

    <div v-if="scenarioTitle" class="pipeline-run-card__scenario">
      {{ scenarioTitle }}
    </div>

    <div
      v-if="claimedBy"
      class="pipeline-run-card__claimed-badge"
      :class="{ 'pipeline-run-card__claimed-badge--other': isLockedByOther }"
    >
      <span class="pipeline-run-card__lock-icon">🔒</span>
      <span>{{ claimedBadgeText }}</span>
    </div>

    <PipelineStageTrack
      :steps="steps"
      :status="status"
      :active-step="activeStep"
      :completed-steps="completedSteps"
      :is-attention-required="isAttentionRequired"
    />

    <div v-if="activeStep" class="pipeline-run-card__current-step">
      <span class="pipeline-run-card__step-prefix">{{ t("pipelineCard.step") }}:</span>
      <span class="pipeline-run-card__step-name">{{ activeStep }}</span>
    </div>

    <div v-if="isAttentionRequired" class="pipeline-run-card__gate-banner">
      <div class="pipeline-run-card__gate-text">
        <span class="attention-required--badge" />
        <span>{{ t("pipelineCard.gateAwaiting") }}</span>
      </div>
      <div class="pipeline-run-card__gate-actions">
        <button
          type="button"
          class="pipeline-run-card__btn pipeline-run-card__btn--approve"
          :disabled="isResponding || isLockedByOther"
          :title="
            isLockedByOther ? t('coworking.lockedByOther', { user: claimedBy }) : ''
          "
          @click.stop="onApprove"
        >
          {{ t("pipelineCard.approve") }}
        </button>
        <button
          type="button"
          class="pipeline-run-card__btn pipeline-run-card__btn--reject"
          :disabled="isResponding || isLockedByOther"
          :title="
            isLockedByOther ? t('coworking.lockedByOther', { user: claimedBy }) : ''
          "
          @click.stop="onReject"
        >
          {{ t("pipelineCard.reject") }}
        </button>
      </div>
    </div>

    <div class="pipeline-run-card__footer">
      <button
        type="button"
        class="pipeline-run-card__browser-btn"
        :title="t('pipelineCard.quickInspect')"
        @click.stop="emit('openBrowser', taskId)"
      >
        🌐 {{ t("pipelineCard.openBrowser") }}
      </button>
      <button
        type="button"
        class="pipeline-run-card__open-btn"
        @click.stop="emit('open', taskId)"
      >
        {{ t("pipelineCard.openRun") }} →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { postConfirmHuman } from "@/shared/api/endpoints/task-gates";
import { useUxStore } from "@/shared/store/ux";
import PipelineStageTrack from "./PipelineStageTrack.vue";

const props = withDefaults(
  defineProps<{
    taskId: string;
    scenarioTitle?: string | null;
    status?: string | null;
    steps?: string[];
    activeStep?: string | null;
    completedSteps?: string[];
    isSelected?: boolean;
    compact?: boolean;
    claimedBy?: string | null;
    currentUserName?: string | null;
  }>(),
  {
    scenarioTitle: null,
    status: "running",
    steps: () => [],
    activeStep: null,
    completedSteps: () => [],
    isSelected: false,
    compact: false,
    claimedBy: null,
    currentUserName: null,
  },
);

const emit = defineEmits<{
  select: [taskId: string];
  open: [taskId: string];
  openBrowser: [taskId: string];
  gateResolved: [taskId: string, approved: boolean];
}>();

const { t } = useI18n();
const ux = useUxStore();
const isResponding = ref(false);

const isLockedByOther = computed(() => {
  return Boolean(
    props.claimedBy &&
    props.currentUserName &&
    props.claimedBy.trim().toLowerCase() !== props.currentUserName.trim().toLowerCase(),
  );
});

const claimedBadgeText = computed(() => {
  if (!props.claimedBy) return "";
  if (
    props.currentUserName &&
    props.claimedBy.trim().toLowerCase() === props.currentUserName.trim().toLowerCase()
  ) {
    return t("coworking.claimedByMe");
  }
  if (isLockedByOther.value) {
    return t("coworking.lockedByOther", { user: props.claimedBy });
  }
  return t("coworking.claimedBy", { user: props.claimedBy });
});

const isAttentionRequired = computed(() => {
  const normalizedStatus = (props.status ?? "").toLowerCase();
  return (
    normalizedStatus === "awaiting_human" ||
    normalizedStatus === "awaiting_shell_confirm" ||
    normalizedStatus === "blocked"
  );
});

const statusClass = computed(() => {
  const normalizedStatus = (props.status ?? "").toLowerCase();
  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "done" ||
    normalizedStatus === "success"
  ) {
    return "completed";
  }
  if (normalizedStatus === "failed" || normalizedStatus === "error") {
    return "failed";
  }
  if (isAttentionRequired.value) return "attention";
  return "running";
});

const statusLabel = computed(() => {
  const normalizedStatus = props.status ?? "running";
  if (isAttentionRequired.value) return t("pipelineCard.gateAwaiting");
  return normalizedStatus.replace(/_/g, " ");
});

// The feedback string reaches the agent prompt, so it must not follow the
// operator's UI locale. These are stable machine markers, not user copy.
const APPROVE_FEEDBACK_MARKER = "[multi-run-grid] approved";
const REJECT_FEEDBACK_MARKER = "[multi-run-grid] rejected";

async function resolveGate(approved: boolean): Promise<void> {
  if (isResponding.value) return;
  isResponding.value = true;
  try {
    await postConfirmHuman(
      props.taskId,
      approved,
      approved ? APPROVE_FEEDBACK_MARKER : REJECT_FEEDBACK_MARKER,
    );
    emit("gateResolved", props.taskId, approved);
  } catch (gateError: unknown) {
    const message = gateError instanceof Error ? gateError.message : String(gateError);
    ux.notify(t("pipelineCard.gateActionFailed", { error: message }), "error");
  } finally {
    isResponding.value = false;
  }
}

function onApprove(): void {
  void resolveGate(true);
}

function onReject(): void {
  void resolveGate(false);
}
</script>

<style scoped src="./pipeline-run-card.css"></style>
