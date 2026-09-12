<template>
  <div class="pipeline-grid-view">
    <div class="pipeline-grid-view__toolbar">
      <div class="pipeline-grid-view__title-group">
        <h2 class="pipeline-grid-view__title">{{ t("pipelineCard.parallelPipes") }}</h2>
        <span class="pipeline-grid-view__count-badge">{{ filteredRuns.length }}</span>
      </div>

      <div class="pipeline-grid-view__modes">
        <button
          type="button"
          class="pipeline-grid-view__mode-btn"
          @click="navigateToMode('/run')"
        >
          {{ t("runView.modes.focus") }}
        </button>
        <button
          type="button"
          class="pipeline-grid-view__mode-btn pipeline-grid-view__mode-btn--active"
        >
          {{ t("runView.modes.grid") }}
        </button>
        <button
          type="button"
          class="pipeline-grid-view__mode-btn"
          @click="navigateToMode('/run/canvas')"
        >
          {{ t("runView.modes.canvas") }}
        </button>
      </div>
    </div>

    <div class="pipeline-grid-view__filter-bar">
      <div class="pipeline-grid-view__filters">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          type="button"
          class="pipeline-grid-view__filter-tab"
          :class="{
            'pipeline-grid-view__filter-tab--active': currentFilter === tab.key,
          }"
          @click="currentFilter = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <input
        v-model="searchQuery"
        type="search"
        class="pipeline-grid-view__search"
        :placeholder="t('pipelineCard.filterAll') + '...'"
      />
    </div>

    <div v-if="filteredRuns.length === 0" class="pipeline-grid-view__empty">
      <p class="pipeline-grid-view__empty-text">{{ t("pipelineCard.noRuns") }}</p>
      <button
        type="button"
        class="pipeline-grid-view__create-btn"
        @click="navigateToMode('/run')"
      >
        + {{ t("runView.modes.focus") }}
      </button>
    </div>

    <div v-else class="pipeline-grid-view__grid">
      <PipelineRunCard
        v-for="run in filteredRuns"
        :key="run.taskId"
        :task-id="run.taskId"
        :scenario-title="run.scenarioTitle"
        :status="run.status"
        :steps="run.steps"
        :active-step="run.activeStep"
        :completed-steps="run.completedSteps"
        :is-selected="run.taskId === ui.taskId"
        :claimed-by="coworking.gateClaims.value.get(run.taskId)?.userName"
        :current-user-name="coworking.localUser.value.name"
        @select="onSelectRun"
        @open="onOpenRun"
        @open-browser="activeBrowserTaskId = $event"
        @gate-resolved="onGateResolved"
      />
    </div>

    <BrowserViewportModal
      v-if="activeBrowserTaskId"
      :task-id="activeBrowserTaskId"
      @close="activeBrowserTaskId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";
import { isTaskActive } from "@/shared/lib/task-status";
import { useCoworking } from "@/entities/coworking/useCoworking";
import {
  useMultiRunItems,
  isAttentionStatus,
  type MultiRunItem,
} from "./useMultiRunItems";
import PipelineRunCard from "@/widgets/pipeline-grid/PipelineRunCard.vue";
import BrowserViewportModal from "@/widgets/browser-viewport/BrowserViewportModal.vue";

const ui = useUiStore();
const router = useRouter();
const { t } = useI18n();
const coworking = useCoworking();
const { allRuns, recordGateResolution } = useMultiRunItems();

const activeBrowserTaskId = ref<string | null>(null);
const currentFilter = ref<"all" | "active" | "attention" | "done">("all");
const searchQuery = ref("");

const filterTabs = computed(() => [
  { key: "all" as const, label: t("pipelineCard.filterAll") },
  { key: "active" as const, label: t("pipelineCard.filterActive") },
  { key: "attention" as const, label: t("pipelineCard.filterAttention") },
  { key: "done" as const, label: t("pipelineCard.filterDone") },
]);

const filteredRuns = computed<MultiRunItem[]>(() => {
  let list = allRuns.value;

  if (currentFilter.value === "active") {
    list = list.filter((run) => isTaskActive(run.status));
  } else if (currentFilter.value === "attention") {
    list = list.filter((run) => isAttentionStatus(run.status));
  } else if (currentFilter.value === "done") {
    list = list.filter((run) => !isTaskActive(run.status));
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    list = list.filter(
      (run) =>
        run.taskId.toLowerCase().includes(query) ||
        (run.scenarioTitle && run.scenarioTitle.toLowerCase().includes(query)),
    );
  }

  return list;
});

function navigateToMode(path: string): void {
  void router.push(path);
}

function onSelectRun(taskId: string): void {
  ui.taskId = taskId;
}

function onOpenRun(taskId: string): void {
  ui.taskId = taskId;
  const entry = ui.historyList.find((historyEntry) => historyEntry.taskId === taskId);
  const active = entry ? isTaskActive(entry.status ?? "") : true;
  if (active) {
    void router.push("/run/active");
  } else {
    void router.push(`/run/done/${taskId}`);
  }
}

function onGateResolved(taskId: string, approved: boolean): void {
  recordGateResolution(taskId, approved);
}
</script>

<style scoped src="./pipeline-grid-view.css"></style>
