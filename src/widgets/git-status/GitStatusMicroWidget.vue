<template>
  <div v-if="status && status.is_git" class="git-status-widget">
    <button
      type="button"
      class="git-status-pill"
      :class="{
        'git-status-pill--open': isPopoverOpen,
        'git-status-pill--dirty': !status.clean,
      }"
      :title="t('gitStatus.branch')"
      @click="isPopoverOpen = !isPopoverOpen"
    >
      <svg
        class="git-branch-icon"
        viewBox="0 0 16 16"
        width="13"
        height="13"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.492 2.492 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25zM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zM3.5 3.25a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0z"
        />
      </svg>
      <span class="git-status-pill__branch">{{ status.branch || "HEAD" }}</span>
      <span v-if="status.is_worktree" class="git-status-pill__worktree">
        {{ t("gitStatus.worktree") }}
      </span>

      <span v-if="status.clean" class="git-status-badge git-status-badge--clean">
        &check; {{ t("gitStatus.clean") }}
      </span>
      <span v-else class="git-status-badge git-status-badge--dirty">
        {{ dirtyCount }} {{ t("gitStatus.modified") }}
      </span>

      <span v-if="status.insertions" class="git-status-delta git-status-delta--ins">
        +{{ status.insertions }}
      </span>
      <span v-if="status.deletions" class="git-status-delta git-status-delta--del">
        -{{ status.deletions }}
      </span>
    </button>

    <!-- Popover with micro commit graph & details -->
    <div v-if="isPopoverOpen" class="git-status-popover" role="dialog">
      <header class="git-status-popover__header">
        <div class="git-status-popover__title">
          <span
            >Git: <strong>{{ status.branch }}</strong></span
          >
          <code v-if="status.head_sha" class="git-status-popover__sha"
            >@{{ status.head_sha }}</code
          >
        </div>
        <button
          type="button"
          class="git-status-popover__refresh"
          :title="t('gitStatus.refresh')"
          :disabled="isLoading"
          @click="fetchStatus"
        >
          &#x21bb;
        </button>
      </header>

      <div class="git-status-popover__body">
        <h4 class="git-status-popover__subhead">{{ t("gitStatus.commits") }}</h4>
        <div
          v-if="status.recent_commits && status.recent_commits.length > 0"
          class="git-micro-graph"
        >
          <div
            v-for="(commit, commitIndex) in status.recent_commits"
            :key="commit.sha"
            class="git-micro-graph__node"
          >
            <div class="git-micro-graph__spine">
              <span
                class="git-micro-graph__dot"
                :class="{ 'git-micro-graph__dot--latest': commitIndex === 0 }"
              />
              <span
                v-if="commitIndex < status.recent_commits.length - 1"
                class="git-micro-graph__line"
              />
            </div>
            <div class="git-micro-graph__details">
              <div class="git-micro-graph__top">
                <code class="git-micro-graph__sha">{{ commit.sha }}</code>
                <span class="git-micro-graph__time">{{ commit.time_ago }}</span>
              </div>
              <p class="git-micro-graph__message">{{ commit.message }}</p>
              <span class="git-micro-graph__author">{{ commit.author }}</span>
            </div>
          </div>
        </div>
        <p v-else class="git-status-popover__empty">
          {{ t("gitStatus.noCommits") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { getGitStatus, type GitStatusPayload } from "@/shared/api/endpoints/workspace";

const props = defineProps<{
  workspaceRoot?: string | null;
  taskId?: string | null;
}>();

const { t } = useI18n();
const status = ref<GitStatusPayload | null>(null);
const isLoading = ref(false);
const isPopoverOpen = ref(false);
let pollInterval: ReturnType<typeof setInterval> | null = null;

const dirtyCount = computed(() => {
  if (!status.value) return 0;
  return (status.value.staged_count ?? 0) + (status.value.unstaged_count ?? 0);
});

async function fetchStatus(): Promise<void> {
  if (!props.workspaceRoot && !props.taskId) return;
  isLoading.value = true;
  try {
    status.value = await getGitStatus({
      workspaceRoot: props.workspaceRoot,
      taskId: props.taskId,
    });
  } catch {
    // Non-git or unavailable
    status.value = null;
  } finally {
    isLoading.value = false;
  }
}

function setupPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (props.taskId || props.workspaceRoot) {
    pollInterval = setInterval(() => {
      void fetchStatus();
    }, 15000);
  }
}

watch(
  () => [props.workspaceRoot, props.taskId] as const,
  ([workspacePath, currentTaskId]) => {
    if (workspacePath || currentTaskId) {
      void fetchStatus();
      setupPolling();
    }
  },
  { immediate: true },
);

onMounted(() => {
  void fetchStatus();
  setupPolling();
});

onBeforeUnmount(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
});
</script>

<style scoped src="./git-status-micro-widget.css"></style>
