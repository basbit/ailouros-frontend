<template>
  <div class="chat-page run-idle">
    <AppHeaderContainer />

    <div class="chat-layout">
      <!-- Sidebar / Threads Panel -->
      <aside
        class="chat-sidebar"
        :class="{ 'chat-sidebar--collapsed': sidebarCollapsed }"
      >
        <div class="chat-sidebar__header">
          <button
            type="button"
            class="chat-sidebar__new-btn"
            @click="onNewConversation"
          >
            + {{ t("chat.newConversation") }}
          </button>
          <button
            type="button"
            class="chat-sidebar__toggle"
            :title="
              sidebarCollapsed ? t('chat.expandSidebar') : t('chat.collapseSidebar')
            "
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            {{ sidebarCollapsed ? "»" : "«" }}
          </button>
        </div>

        <div v-if="!sidebarCollapsed" class="chat-sidebar__list">
          <div v-if="loadingThreads" class="chat-sidebar__hint">
            {{ t("chat.loadingThreads") }}
          </div>
          <div v-else-if="threadsList.length === 0" class="chat-sidebar__hint">
            {{ t("chat.noThreads") }}
          </div>
          <div
            v-for="th in threadsList"
            :key="th.id"
            class="chat-thread-item"
            :class="{ 'chat-thread-item--active': activeThread?.id === th.id }"
            @click="selectThread(th.id)"
          >
            <div class="chat-thread-item__title">
              {{ th.title || t("chat.untitled") }}
            </div>
            <div class="chat-thread-item__meta">
              <span>{{ th.turn_count }} {{ t("chat.turns") }}</span>
              <span>{{ formatTime(th.updated_at) }}</span>
            </div>
            <button
              type="button"
              class="chat-thread-item__del"
              :title="t('chat.deleteThread')"
              @click.stop="removeThread(th.id)"
            >
              &times;
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Chat Conversation Feed -->
      <main class="chat-main">
        <div ref="feedRef" class="chat-feed">
          <!-- Empty state hero -->
          <div
            v-if="!activeThread || activeThread.turns.length === 0"
            class="chat-hero"
          >
            <h2 class="chat-hero__title">{{ t("chat.heroTitle") }}</h2>
            <p class="chat-hero__subtitle">{{ t("chat.heroSubtitle") }}</p>
            <div class="chat-hero__suggestions">
              <button
                v-for="s in suggestions"
                :key="s"
                type="button"
                class="chat-hero__chip"
                @click="onApplySuggestion(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <!-- Turns list -->
          <div
            v-for="turn in activeThread?.turns ?? []"
            :key="turn.id"
            class="chat-turn"
          >
            <!-- User Message -->
            <div class="chat-bubble chat-bubble--user">
              <div class="chat-bubble__header">
                <span class="chat-bubble__author">{{ t("chat.you") }}</span>
                <span class="chat-bubble__time">{{ formatTime(turn.created_at) }}</span>
              </div>
              <div class="chat-bubble__body">
                {{ turn.user_message }}
              </div>
              <!-- Attachment previews: images inline, files as chips -->
              <div
                v-if="turn.attachments?.length || turn.image_attachments?.length"
                class="chat-bubble__attachments"
              >
                <button
                  v-for="img in turn.image_attachments"
                  :key="img.path"
                  type="button"
                  class="chat-image-thumb"
                  :title="img.name"
                  @click="openAttachment(turn.id, img.name)"
                >
                  <img
                    :src="attachmentSrc(turn.id, img.name)"
                    :alt="img.name"
                    loading="lazy"
                  />
                </button>
                <a
                  v-for="att in turn.attachments"
                  :key="att.name"
                  class="chat-attachment-chip"
                  :href="attachmentSrc(turn.id, att.name)"
                  :download="att.name"
                >
                  📄 {{ att.name }}
                </a>
              </div>
            </div>

            <!-- Pipeline progress bar under the user's message (click → pipeline history) -->
            <TurnPipelineBar
              v-if="turn.task_id || turn.id === activeRunningTurnId"
              :summary="turnSummary(turn)"
              :task-id="turn.task_id ?? null"
            />

            <!-- Assistant Response Message -->
            <div
              v-if="turn.assistant_message"
              class="chat-bubble chat-bubble--assistant"
            >
              <div class="chat-bubble__header">
                <span class="chat-bubble__author">AIlourOS Swarm</span>
              </div>
              <div class="chat-bubble__body">
                {{ turn.assistant_message }}
              </div>
            </div>
          </div>
        </div>

        <TaskGatesOverlay
          :current-pipeline-steps="runState.currentPipelineSteps.value"
          @human-resume="gateActions.onHumanResume"
          @confirm-shell="gateActions.onConfirmShell"
          @confirm-manual-shell="gateActions.onConfirmManualShell"
          @retry="gateActions.onRetry"
          @continue-pipeline="gateActions.onContinuePipeline"
        />

        <!-- Sticky Bottom Input Bar -->
        <footer class="chat-input-bar">
          <div class="chat-input-container">
            <PromptInput
              v-model="settings.form.prompt"
              :workspace-root="settings.form.workspace_root"
              :attachments="settings.form.attachments ?? []"
              :image-attachments="settings.form.image_attachments ?? []"
              :rows="3"
              :placeholder="
                isAwaitingHuman
                  ? t('chat.inputPlaceholderGate')
                  : t('chat.inputPlaceholder')
              "
              @update:attachments="
                (next) => {
                  settings.form.attachments = next;
                }
              "
              @update:image-attachments="
                (next) => {
                  settings.form.image_attachments = next;
                }
              "
            />
            <div class="chat-input-actions">
              <ScenarioQuickLaunch
                :model-value="settings.form.scenario_id"
                :favorites="settings.form.favorite_scenarios"
                :custom-scenarios="settings.form.custom_scenarios"
                @update:model-value="onScenarioPick"
              />
              <div class="chat-input-spacer" />
              <button
                v-if="isRunning"
                type="button"
                class="chat-btn chat-btn--stop"
                @click="onStop"
              >
                {{ t("chat.stop") }}
              </button>
              <button
                v-else
                type="button"
                class="chat-btn chat-btn--send"
                :disabled="!canSend || isStarting"
                @click="onSendPrompt"
              >
                {{
                  isStarting
                    ? t("chat.starting")
                    : isAwaitingHuman
                      ? t("chat.sendAnswer")
                      : t("chat.send")
                }}
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import PromptInput from "@/features/prompt-input/PromptInput.vue";
import ScenarioQuickLaunch from "@/features/scenario-picker/ScenarioQuickLaunch.vue";
import { useConversationThread } from "@/features/conversation-thread/useConversationThread";
import { turnAttachmentUrl } from "@/shared/api/endpoints/conversation";
import { useTurnPipelineSummary } from "@/pages/chat/useTurnPipelineSummary";
import type { TurnPipelineSummary } from "@/entities/pipeline-progress";
import TurnPipelineBar from "@/features/chat/TurnPipelineBar.vue";
import { useInjectedAppSettings } from "@/entities/app-settings/contract";
import { useUiStore } from "@/shared/store/ui";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { useSwarmRunStart } from "@/features/swarm-run/useSwarmRunStart";
import { useSwarmRunState } from "@/features/swarm-run/useSwarmRunState";
import { useSwarmRunTickHandler } from "@/features/swarm-run/useSwarmRunTickHandler";
import { useSwarmRunPreflight } from "@/features/swarm-run/useSwarmRunPreflight";
import { useSwarmRunGateActions } from "@/features/swarm-run/useSwarmRunGateActions";
import { useInjectedSwarmRunController } from "@/features/swarm-run";
import { useTurnRunLink } from "./useTurnRunLink";
import { findActiveTurn, resolveTurnStatusUpdate } from "./turnStatusEffects";
import TaskGatesOverlay from "@/features/task-gate/TaskGatesOverlay.vue";
import { cancelTask } from "@/shared/api/endpoints/tasks-runtime";

const { t } = useI18n();
const ui = useUiStore();
const ux = useUxStore();
const settings = useInjectedAppSettings();

const {
  threadsList,
  activeThread,
  loadingThreads,
  loadThreads,
  selectThread,
  startNewThread,
  removeThread,
  addTurn,
  patchTurn,
} = useConversationThread();

const sidebarCollapsed = ref(false);
const feedRef = ref<HTMLDivElement | null>(null);
const activeRunningTurnId = ref<string | null>(null);
const isStarting = ref(false);

const isRunning = computed(
  () => ui.taskStatus === "running" || ui.taskStatus === "in_progress",
);

const isAwaitingHuman = computed(() => ui.taskStatus === "awaiting_human");

const canSend = computed(() => !!settings.form.prompt?.trim());

const suggestions = [
  "Build a REST API with FastAPI and SQLite",
  "Add dark mode theme to the frontend",
  "Refactor auth logic and add unit tests",
];

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const activeThreadForUrls = () => activeThread.value?.id ?? "";

function attachmentSrc(turnId: string, name: string): string {
  const threadId = activeThreadForUrls();
  return threadId ? turnAttachmentUrl(threadId, turnId, name) : "";
}

function openAttachment(turnId: string, name: string): void {
  const src = attachmentSrc(turnId, name);
  if (src) window.open(src, "_blank", "noopener");
}

// One summary per turn task id; created lazily as turns render. Live turns
// (the turn the page is currently driving) read the shared ui-store; past
// turns load their snapshot once and cache it inside the composable.
const summaryCache = new Map<string, TurnPipelineSummary>();

function turnSummary(turn: {
  id: string;
  task_id?: string | null;
}): TurnPipelineSummary {
  const cacheKey = turn.task_id || `turn:${turn.id}`;
  const existing = summaryCache.get(cacheKey);
  if (existing) return existing;
  const summary = useTurnPipelineSummary({
    taskId: () => turn.task_id ?? null,
    isLive: () =>
      turn.id === activeRunningTurnId.value &&
      (!turn.task_id || turn.task_id === ui.taskId),
  });
  summaryCache.set(cacheKey, summary);
  return summary;
}

function onApplySuggestion(s: string): void {
  settings.form.prompt = s;
}

function onScenarioPick(scenarioId: string): void {
  settings.form.scenario_id = scenarioId;
  settings.saveSettingsSoon();
}

async function onNewConversation(): Promise<void> {
  const th = await startNewThread();
  await selectThread(th.id);
}

// The app bootstrap provides ONE run controller owning the WebSocket. Reusing
// it (instead of composing a page-local runner stack with a stubbed WS
// subscribe) is what keeps live ticks flowing: without the real subscribe,
// the backend ws pump never learns the new task id, applyTick gets
// task: null and awaiting_human / gate forms never reach the UI.
const controller = useInjectedSwarmRunController();
const runState = useSwarmRunState();
const tickHandler = useSwarmRunTickHandler(runState);
const preflight = useSwarmRunPreflight(runState, settings);

const runner = useSwarmRunStart({
  state: runState,
  tickHandler,
  sendWsSubscribe: controller.sendWsSubscribe,
  settings,
  ux,
  t,
  preflight,
  onAwaitingClarification: () => {
    // The stream paused on a clarify form — surface it before the next WS
    // tick so the user sees the questions immediately.
    ui.humanGateVisible = true;
    ui.shellGateVisible = false;
    ui.retryGateVisible = false;
  },
});

const gateActions = useSwarmRunGateActions({
  state: runState,
  tickHandler,
  sendWsSubscribe: controller.sendWsSubscribe,
  settings,
  ux,
});

async function onSendPrompt(): Promise<void> {
  const promptText = settings.form.prompt.trim();
  if (!promptText) return;

  // Gate is open: the same input bar answers it directly in the chat, no need
  // to touch the gate form. The message becomes the human-resume feedback and
  // lands in the thread as the user's own bubble; the status watcher flips
  // the paused turn back to "running" as soon as the run resumes.
  if (isAwaitingHuman.value) {
    if (!ui.taskId) return;
    settings.form.prompt = "";
    await addTurn(promptText, [], []).catch(() => undefined);
    await gateActions.onHumanResume(promptText);
    scrollToBottom();
    return;
  }

  if (isRunning.value || isStarting.value) return;

  isStarting.value = true;
  try {
    const { turn } = await addTurn(
      promptText,
      settings.form.attachments,
      settings.form.image_attachments,
    );
    activeRunningTurnId.value = turn.id;

    // The task id is attached by the watcher below as soon as the run reports
    // it — awaiting the stream here would leave the turn unlinked for the whole
    // run (and forever when the run fails), so the progress bar could never
    // open its pipeline.
    await runner.onStartRun();

    // Clear prompt in input box
    settings.form.prompt = "";
    settings.form.attachments = [];
    settings.form.image_attachments = [];
    scrollToBottom();
  } finally {
    isStarting.value = false;
  }
}

async function onStop(): Promise<void> {
  if (ui.taskId) {
    try {
      await cancelTask(ui.taskId);
    } catch {
      /* ignore */
    }
  }
  ui.taskStatus = "cancelled";
  if (activeRunningTurnId.value) {
    await patchTurn(activeRunningTurnId.value, {
      status: "failed",
      assistant_message: "Run cancelled by user.",
    });
  }
}

useTurnRunLink({
  taskId: () => ui.taskId ?? null,
  activeTurnId: activeRunningTurnId,
  linkedTaskId: (turnId) =>
    activeThread.value?.turns.find((item) => item.id === turnId)?.task_id ?? null,
  patchTurn: (turnId, updates) => void patchTurn(turnId, updates),
});

// Watch active task status: map the run's live status onto the chat turn it
// belongs to. All branching lives in the pure resolveTurnStatusUpdate — the
// guards there keep the once-per-second WS ticks from re-PATCHing the turn.
watch(
  () => ui.taskStatus,
  async (status) => {
    const turn = findActiveTurn(activeThread.value?.turns, activeRunningTurnId.value);
    const update = resolveTurnStatusUpdate({
      taskStatus: status,
      turnStatus: turn?.status ?? null,
      blockedReason: ui.blockedReason,
      taskError: ui.taskError,
      copy: {
        doneWithFailures: t("chat.doneWithFailures"),
        blockedBubble: (reason) => t("chat.blockedBubble", { reason }),
        blockedTitle: t("chat.blockedTitle"),
      },
    });
    if (!update || !turn) return;
    await patchTurn(turn.id, {
      status: update.status,
      assistant_message: update.assistantMessage,
    });
    if (update.scroll) scrollToBottom();
  },
);

function scrollToBottom(): void {
  nextTick(() => {
    if (feedRef.value) {
      feedRef.value.scrollTop = feedRef.value.scrollHeight;
    }
  });
}

onMounted(() => {
  void loadThreads();
  if (threadsList.value.length > 0 && !activeThread.value) {
    void selectThread(threadsList.value[0].id);
  }
});

// After a reload the active turn reference is gone (in-memory ref), but the
// backend thread still holds the turn↔task link. Re-bind it so the pipeline
// bar under the user's message survives a page reload.
watch(
  () => activeThread.value?.turns.length,
  () => {
    if (activeRunningTurnId.value) return;
    const live = [...(activeThread.value?.turns ?? [])]
      .reverse()
      .find(
        (turn) =>
          turn.task_id &&
          (turn.status === "running" || turn.status === "awaiting_human"),
      );
    if (live) activeRunningTurnId.value = live.id;
  },
  { immediate: true },
);
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.chat-layout {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

/* Sidebar */
.chat-sidebar {
  width: 260px;
  background: var(--card);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.chat-sidebar--collapsed {
  width: 48px;
}

.chat-sidebar__header {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--line);
}

.chat-sidebar__new-btn {
  flex: 1;
  appearance: none;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--r-md);
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-sidebar__toggle {
  appearance: none;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  color: var(--ink-2);
  padding: 4px 8px;
  cursor: pointer;
}

.chat-sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-sidebar__hint {
  padding: 12px;
  font-size: 12px;
  color: var(--ink-4);
  text-align: center;
}

.chat-thread-item {
  padding: 8px 10px;
  border-radius: var(--r-md);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  border: 1px solid transparent;
}

.chat-thread-item:hover {
  background: var(--bg-2);
}

.chat-thread-item--active {
  background: var(--bg-2);
  border-color: var(--accent);
}

.chat-thread-item__title {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 18px;
}

.chat-thread-item__meta {
  font-size: 10px;
  color: var(--ink-4);
  display: flex;
  justify-content: space-between;
}

.chat-thread-item__del {
  position: absolute;
  top: 6px;
  right: 6px;
  background: transparent;
  border: none;
  color: var(--ink-4);
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
}

.chat-thread-item:hover .chat-thread-item__del {
  opacity: 1;
}

.chat-thread-item__del:hover {
  color: var(--error);
}

/* Main chat area */
.chat-main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--bg);
}

.chat-feed {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Hero */
.chat-hero {
  margin: auto;
  max-width: 600px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 40px 20px;
}

.chat-hero__title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--ink);
  margin: 0;
}

.chat-hero__subtitle {
  font-size: 14px;
  color: var(--ink-3);
  margin: 0;
}

.chat-hero__suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.chat-hero__chip {
  appearance: none;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 8px 14px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}

.chat-hero__chip:hover {
  border-color: var(--accent);
  color: var(--ink);
}

/* Turn & Bubbles */
.chat-turn {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.chat-bubble {
  padding: 14px 18px;
  border-radius: var(--r-lg);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-bubble--user {
  background: var(--card);
  border: 1px solid var(--line);
  align-self: flex-end;
  max-width: 80%;
}

.chat-bubble--assistant {
  background: var(--card-soft, var(--card));
  border: 1px solid var(--line);
  align-self: flex-start;
  max-width: 85%;
}

.chat-bubble__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
  color: var(--ink-4);
  font-family: var(--font-mono);
}

.chat-bubble__author {
  font-weight: 600;
  color: var(--ink-2);
}

.chat-bubble__body {
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink);
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-bubble__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.chat-attachment-chip {
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  color: var(--ink-2);
  text-decoration: none;
}

.chat-attachment-chip:hover {
  border-color: var(--accent);
  color: var(--ink);
}

/* Image attachment previews inside the user bubble */
.chat-image-thumb {
  appearance: none;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  overflow: hidden;
  cursor: zoom-in;
  background: var(--bg-2);
  line-height: 0;
}

.chat-image-thumb img {
  display: block;
  width: 96px;
  height: 96px;
  object-fit: cover;
}

.chat-image-thumb:hover {
  border-color: var(--accent);
}

/* Execution card */
.chat-execution-card {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-execution-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}

.chat-execution-card__title {
  color: var(--ink);
}

.chat-execution-card__status {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  text-transform: uppercase;
  font-family: var(--font-mono);
}

.chat-execution-card__status--running {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
}

.chat-execution-card__status--completed {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.chat-execution-card__status--failed {
  background: color-mix(in srgb, var(--error) 15%, transparent);
  color: var(--error);
}

.chat-execution-card__artifacts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid var(--line);
  padding-top: 8px;
}

.chat-artifacts-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-3);
}

.chat-artifacts-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chat-artifact-chip {
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-2);
  border: 1px solid var(--line);
  color: var(--ink-2);
}

/* Bottom input bar */
.chat-input-bar {
  padding: 16px 32px 24px;
  background: var(--bg);
  border-top: 1px solid var(--line);
}

.chat-input-container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-input-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-input-spacer {
  flex: 1;
}

.chat-btn {
  appearance: none;
  border: none;
  border-radius: var(--r-md);
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.chat-btn--send {
  background: var(--accent);
  color: #fff;
}

.chat-btn--send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-btn--stop {
  background: var(--error);
  color: #fff;
}
</style>
