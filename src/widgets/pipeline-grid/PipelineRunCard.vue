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

    <!-- Coworking Lock Badge -->
    <div
      v-if="claimedBy"
      class="pipeline-run-card__claimed-badge"
      :class="{ 'pipeline-run-card__claimed-badge--other': isLockedByOther }"
    >
      <span class="pipeline-run-card__lock-icon">🔒</span>
      <span>{{ claimedBadgeText }}</span>
    </div>

    <!-- Mini LangGraph Pipeline Progress Track -->
    <PipelineStageTrack
      :status="status"
      :active-step="activeStep"
      :is-attention-required="isAttentionRequired"
    />

    <!-- Active Step Snippet -->
    <div v-if="activeStep" class="pipeline-run-card__current-step">
      <span class="pipeline-run-card__step-prefix">{{ t("pipelineCard.step") }}:</span>
      <span class="pipeline-run-card__step-name">{{ activeStep }}</span>
    </div>

    <!-- Attention / Human Gate Quick Response Banner -->
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

    <!-- Card Footer -->
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
import PipelineStageTrack, { type StageInfo } from "./PipelineStageTrack.vue";

export type { StageInfo };

const props = withDefaults(
  defineProps<{
    taskId: string;
    scenarioTitle?: string | null;
    status?: string | null;
    activeStep?: string | null;
    isSelected?: boolean;
    compact?: boolean;
    claimedBy?: string | null;
    currentUserName?: string | null;
  }>(),
  {
    scenarioTitle: null,
    status: "running",
    activeStep: null,
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
  "open-browser": [taskId: string];
  gateResolved: [taskId: string, approved: boolean];
  "gate-resolved": [taskId: string, approved: boolean];
}>();

const { t } = useI18n();
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

async function onApprove(): Promise<void> {
  if (isResponding.value) return;
  isResponding.value = true;
  try {
    await postConfirmHuman(props.taskId, true, "Approved via Multi-Run Grid");
    emit("gateResolved", props.taskId, true);
  } catch (err) {
    console.error("Failed to approve gate", err);
  } finally {
    isResponding.value = false;
  }
}

async function onReject(): Promise<void> {
  if (isResponding.value) return;
  isResponding.value = true;
  try {
    await postConfirmHuman(props.taskId, false, "Rejected via Multi-Run Grid");
    emit("gateResolved", props.taskId, false);
  } catch (err) {
    console.error("Failed to reject gate", err);
  } finally {
    isResponding.value = false;
  }
}
</script>

<style scoped src="./pipeline-run-card.css"></style>
