<template>
  <header class="app-header">
    <AppHeaderLogo :name="t('app.title')" />

    <div class="hdr-sep"></div>

    <nav class="hdr-tabs" :aria-label="t('header.tabs.run')">
      <button
        v-for="tab in topTabs"
        :key="tab.key"
        type="button"
        class="hdr-tab"
        :class="{ 'hdr-tab--active': activeTopTab === tab.key }"
        @click="navigateToTab(tab.target)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="hdr-sep"></div>

    <ProjectSwitcher
      :current-id="currentProjectId"
      :project-list="projectList"
      @change="emit('project-change', $event)"
      @new="emit('project-new')"
      @rename="emit('project-rename', $event)"
      @delete="emit('project-delete', $event)"
      @edit="emit('project-edit', $event)"
    />

    <div
      class="task-pill"
      :class="{ running: isRunning, 'attention-required--glow': isAttentionRequired }"
    >
      <span v-if="isAttentionRequired" class="attention-required--badge"></span>
      <span v-else class="dot"></span>
      <button
        v-if="taskId && isRunning"
        type="button"
        class="task-pill__resume"
        :title="t('header.resumeRun')"
        :aria-label="t('header.resumeRun')"
        @click="emit('resume-run')"
      >
        {{ taskId }}
      </button>
      <span v-else>{{
        taskId ?? (isRunning ? t("header.starting") : t("header.noTask"))
      }}</span>
      <button
        v-if="taskId && !isRunning"
        type="button"
        class="task-pill__close"
        :title="t('header.closeTask')"
        :aria-label="t('header.closeTask')"
        @click="emit('close-task')"
      >
        &#10005;
      </button>
    </div>

    <TaskBudgetBadge :task-id="taskId" :is-running="isRunning" />

    <div v-if="(activeRunIds ?? []).length > 1" class="active-runs">
      <span v-if="isAttentionRequired" class="attention-required--badge"></span>
      <select
        class="active-runs__select"
        :class="{ 'attention-required--glow': isAttentionRequired }"
        :title="t('header.activeRuns')"
        :aria-label="t('header.activeRuns')"
        :value="taskId ?? ''"
        @change="emit('switch-run', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="id in activeRunIds" :key="id" :value="id">
          {{ id }}
        </option>
      </select>
    </div>

    <div v-if="isRunRoute" class="header-view-modes">
      <button
        type="button"
        class="header-view-mode-btn"
        :class="{
          'header-view-mode-btn--active':
            currentPath === '/run' ||
            currentPath === '/run/active' ||
            currentPath.startsWith('/run/done') ||
            currentPath === '/run/classic',
        }"
        :title="t('runView.modes.focus')"
        @click="router.push('/run')"
      >
        {{ t("runView.modes.focus") }}
      </button>
      <button
        type="button"
        class="header-view-mode-btn"
        :class="{ 'header-view-mode-btn--active': currentPath === '/run/grid' }"
        :title="t('runView.modes.grid')"
        @click="router.push('/run/grid')"
      >
        {{ t("runView.modes.grid") }}
      </button>
      <button
        type="button"
        class="header-view-mode-btn"
        :class="{ 'header-view-mode-btn--active': currentPath === '/run/canvas' }"
        :title="t('runView.modes.canvas')"
        @click="router.push('/run/canvas')"
      >
        {{ t("runView.modes.canvas") }}
      </button>
    </div>

    <CoworkingPeersBadge
      :local-user="coworking.localUser.value"
      :peers="coworking.peers.value"
      @update-profile="coworking.updateLocalUserProfile($event.name, $event.color)"
    />

    <div class="hdr-spacer"></div>

    <div class="header-status" :class="{ 'header-status--running': isRunning }">
      <span
        class="header-status-dot"
        :class="{ 'header-status-dot--active': isRunning }"
      ></span>
      {{ isRunning ? t("header.running") : t("header.idle") }}
    </div>

    <AppHeaderHealthBadge :status="healthStatus" @open="emit('open-system-health')" />

    <select
      class="header-locale"
      :title="t('header.locale')"
      :value="preferences.locale"
      @change="
        preferences.setLocale(($event.target as HTMLSelectElement).value as 'en' | 'ru')
      "
    >
      <option value="en">EN</option>
      <option value="ru">RU</option>
    </select>

    <select
      class="header-locale header-theme"
      :title="t('header.theme')"
      :aria-label="t('header.theme')"
      :value="preferences.theme"
      @change="
        preferences.setTheme(
          ($event.target as HTMLSelectElement).value as 'light' | 'dark',
        )
      "
    >
      <option value="light">{{ t("header.themeLight") }}</option>
      <option value="dark">{{ t("header.themeDark") }}</option>
    </select>

    <button
      type="button"
      class="header-sound-btn"
      :class="{ 'header-sound-btn--muted': !preferences.soundAlerts }"
      :title="
        preferences.soundAlerts
          ? t('preferences.soundAlertsOn')
          : t('preferences.soundAlertsOff')
      "
      :aria-label="
        preferences.soundAlerts
          ? t('preferences.soundAlertsOn')
          : t('preferences.soundAlertsOff')
      "
      @click="preferences.toggleSoundAlerts"
    >
      {{ preferences.soundAlerts ? "🔔" : "🔕" }}
    </button>

    <button
      type="button"
      class="report-problem-button"
      :title="t('header.reportProblem')"
      :aria-label="t('header.reportProblem')"
      @click="emit('open-report-problem')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="8" y="6" width="8" height="14" rx="4" />
        <path d="M9 3l1 3" />
        <path d="M15 3l-1 3" />
        <path d="M4 11h4" />
        <path d="M16 11h4" />
        <path d="M4 17h4" />
        <path d="M16 17h4" />
        <path d="M12 10v8" />
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePreferencesStore } from "@/shared/store/preferences";
import { useI18n } from "@/shared/lib/i18n";
import { useUiStore } from "@/shared/store/ui";
import ProjectSwitcher from "@/features/project-settings/ProjectSwitcher.vue";
import AppHeaderLogo from "./AppHeaderLogo.vue";
import AppHeaderHealthBadge from "./AppHeaderHealthBadge.vue";
import { useAppHeaderTabs } from "./useAppHeaderTabs";
import { useSystemHealth } from "@/features/system-health/useSystemHealth";
import { useCoworking } from "@/features/coworking/useCoworking";
import CoworkingPeersBadge from "@/features/coworking/CoworkingPeersBadge.vue";
import TaskBudgetBadge from "@/features/task-budget/TaskBudgetBadge.vue";

const route = useRoute();
const router = useRouter();
const currentPath = computed(() => route?.path ?? "");
const isRunRoute = computed(
  () => currentPath.value.startsWith("/run") || currentPath.value.startsWith("/chat"),
);

const coworking = useCoworking();

const ui = useUiStore();
const isAttentionRequired = computed(() => {
  return (
    ui.humanGateVisible ||
    ui.shellGateVisible ||
    ui.manualShellGateVisible ||
    ui.retryGateVisible ||
    ui.taskStatus === "awaiting_human" ||
    ui.historyList.some(
      (entry) =>
        entry.status === "awaiting_human" &&
        Boolean(entry.taskId) &&
        (ui.activeRunIds ?? []).includes(entry.taskId as string),
    )
  );
});

defineProps<{
  taskId: string | null;
  isRunning: boolean;
  activeRunIds?: string[];
  projectName?: string | null;
  currentProjectId: string;
  projectList: { id: string; name: string }[];
}>();

const emit = defineEmits<{
  "open-system-health": [];
  "close-task": [];
  "open-report-problem": [];
  "resume-run": [];
  "switch-run": [id: string];
  "project-change": [id: string];
  "project-new": [];
  "project-rename": [id: string];
  "project-delete": [id: string];
  "project-edit": [id: string];
}>();

const systemHealth = useSystemHealth(30_000);
void systemHealth.reload();
const healthStatus = systemHealth.status;

const preferences = usePreferencesStore();
const { t } = useI18n();

const { topTabs, activeTopTab, navigateToTab } = useAppHeaderTabs(t);
</script>

<style scoped>
.hdr-spacer {
  flex: 1;
}

.hdr-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: var(--card-soft);
  border: 1px solid var(--line);
}

.hdr-tab {
  appearance: none;
  background: transparent;
  border: none;
  padding: 5px 14px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-3);
  cursor: pointer;
  transition:
    background 0.16s,
    color 0.16s;
}

.hdr-tab:hover {
  color: var(--ink);
}

.hdr-tab--active {
  background: var(--card);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}

.report-problem-button {
  background: none;
  border: 1px solid var(--border);
  cursor: pointer;
  padding: 6px 9px;
  border-radius: 999px;
  line-height: 1;
  color: var(--text2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.18s,
    border-color 0.18s,
    color 0.18s,
    box-shadow 0.18s;
}
.report-problem-button:hover {
  background: var(--surface2);
  border-color: var(--border-hi);
  color: var(--text);
  box-shadow: 0 0 0 2px rgba(244, 193, 93, 0.1);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text3);
  transition: color 0.2s;
}
.header-status--running {
  color: var(--success);
}
.header-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text3);
  flex-shrink: 0;
  transition: background 0.2s;
}
.header-status-dot--active {
  background: var(--success);
  box-shadow: 0 0 6px var(--success);
  animation: pulse 1.4s ease-in-out infinite;
}

.header-locale {
  width: auto;
  min-width: 66px;
  padding: 6px 26px 6px 10px;
  border-radius: 999px;
}

.header-theme {
  min-width: 92px;
}

.active-runs {
  display: inline-flex;
  align-items: center;
  margin-left: 6px;
}

.active-runs__select {
  max-width: 160px;
  padding: 5px 24px 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-family: var(--font-mono);
}

.task-pill__close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0 2px;
  margin-left: 2px;
  font-size: 12px;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.15s;
}
.task-pill__close:hover {
  opacity: 1;
}

.task-pill__resume {
  appearance: none;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}
.task-pill__resume:hover {
  color: var(--success);
}

@media (max-width: 900px) {
  .header-status {
    display: none;
  }
}

.header-view-modes {
  display: inline-flex;
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  padding: 2px;
  gap: 2px;
  margin-left: 6px;
}

.header-view-mode-btn {
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 550;
  padding: 3px 8px;
  border-radius: 4px;
  color: var(--ink-3);
  cursor: pointer;
  transition: all 0.15s ease;
}

.header-view-mode-btn:hover {
  color: var(--ink);
}

.header-view-mode-btn--active {
  background: var(--card);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}

.header-sound-btn {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--ink-2);
  border-radius: var(--r-sm);
  padding: 4px 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  line-height: 1;
}

.header-sound-btn:hover {
  background: var(--bg-2);
  color: var(--ink);
}

.header-sound-btn--muted {
  opacity: 0.55;
  filter: grayscale(1);
}
</style>
