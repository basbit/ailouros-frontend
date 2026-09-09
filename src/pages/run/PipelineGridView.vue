<template>
  <div class="pipeline-grid-view">
    <div class="pipeline-grid-view__toolbar">
      <div class="pipeline-grid-view__title-group">
        <h2 class="pipeline-grid-view__title">{{ t("pipelineCard.parallelPipes") }}</h2>
        <span class="pipeline-grid-view__count-badge">{{ filteredRuns.length }}</span>
      </div>

      <!-- View Mode Switcher -->
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

    <!-- Filters & Search Bar -->
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

    <!-- Empty State -->
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

    <!-- Responsive Card Grid -->
    <div v-else class="pipeline-grid-view__grid">
      <PipelineRunCard
        v-for="run in filteredRuns"
        :key="run.taskId"
        :task-id="run.taskId"
        :scenario-title="run.scenarioTitle"
        :status="run.status"
        :active-step="run.activeStep"
        :is-selected="run.taskId === ui.taskId"
        :claimed-by="coworking.gateClaims.value.get(run.taskId)?.userName"
        :current-user-name="coworking.localUser.value.name"
        @select="onSelectRun"
        @open="onOpenRun"
        @open-browser="activeBrowserTaskId = $event"
        @gate-resolved="onGateResolved"
      />
    </div>

    <!-- Quick Live Browser Modal -->
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
import { useCoworking } from "@/features/coworking/useCoworking";
import PipelineRunCard from "@/widgets/pipeline-grid/PipelineRunCard.vue";
import BrowserViewportModal from "@/widgets/browser-viewport/BrowserViewportModal.vue";

interface RunItem {
  taskId: string;
  scenarioTitle: string | null;
  status: string;
  activeStep: string | null;
}

const ui = useUiStore();
const router = useRouter();
const { t } = useI18n();
const coworking = useCoworking();

const activeBrowserTaskId = ref<string | null>(null);
const currentFilter = ref<"all" | "active" | "attention" | "done">("all");
const searchQuery = ref("");

const filterTabs = computed(() => [
  { key: "all" as const, label: t("pipelineCard.filterAll") },
  { key: "active" as const, label: t("pipelineCard.filterActive") },
  { key: "attention" as const, label: t("pipelineCard.filterAttention") },
  { key: "done" as const, label: t("pipelineCard.filterDone") },
]);

function mergeHistoryRuns(
  historyList: typeof ui.historyList,
  map: Map<string, RunItem>,
): void {
  for (const entry of historyList) {
    const entryTaskId = entry.taskId;
    if (!entryTaskId) continue;
    const title = (entry as Record<string, unknown>).scenarioTitle
      ? String((entry as Record<string, unknown>).scenarioTitle)
      : entry.prompt || null;
    const existing = map.get(entryTaskId);
    if (existing) {
      if (title) existing.scenarioTitle = title;
      if (entry.status) existing.status = String(entry.status);
    } else {
      map.set(entryTaskId, {
        taskId: entryTaskId,
        scenarioTitle: title,
        status: entry.status ? String(entry.status) : "completed",
        activeStep: null,
      });
    }
  }
}

const allRuns = computed<RunItem[]>(() => {
  const map = new Map<string, RunItem>();

  if (ui.taskId) {
    map.set(ui.taskId, {
      taskId: ui.taskId,
      scenarioTitle: ui.taskScenarioTitle,
      status: String(ui.taskStatus ?? "running"),
      activeStep: ui.activeStep,
    });
  }

  for (const identifier of ui.activeRunIds ?? []) {
    if (!map.has(identifier)) {
      map.set(identifier, {
        taskId: identifier,
        scenarioTitle: null,
        status:
          identifier === ui.taskId ? String(ui.taskStatus ?? "running") : "in_progress",
        activeStep: null,
      });
    }
  }

  mergeHistoryRuns(ui.historyList, map);
  return Array.from(map.values());
});

const filteredRuns = computed<RunItem[]>(() => {
  let list = allRuns.value;

  // Filter by category
  if (currentFilter.value === "active") {
    list = list.filter((run) => isTaskActive(run.status));
  } else if (currentFilter.value === "attention") {
    list = list.filter((run) => {
      const normalizedStatus = run.status.toLowerCase();
      return (
        normalizedStatus === "awaiting_human" ||
        normalizedStatus === "awaiting_shell_confirm" ||
        normalizedStatus === "blocked"
      );
    });
  } else if (currentFilter.value === "done") {
    list = list.filter((run) => !isTaskActive(run.status));
  }

  // Search query
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
  const item = allRuns.value.find((run) => run.taskId === taskId);
  if (item) {
    item.status = approved ? "in_progress" : "blocked";
  }
  if (ui.taskId === taskId) {
    ui.humanGateVisible = false;
    ui.taskStatus = approved ? "in_progress" : "blocked";
  }
}
</script>

<style scoped src="./pipeline-grid-view.css"></style>
