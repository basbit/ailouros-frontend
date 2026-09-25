<template>
  <div class="ar-page">
    <AppHeaderContainer />
    <div class="ar-page__body">
      <aside class="ar-page__sidebar">
        <h1 class="ar-page__title">{{ t("autoresearch.title") }}</h1>
        <p class="ar-page__subtitle">{{ t("autoresearch.subtitle") }}</p>
        <button
          type="button"
          class="ar-page__new"
          data-testid="new-session"
          @click="goToNew"
        >
          {{ t("autoresearch.newSession") }}
        </button>
        <h2 class="ar-page__heading">{{ t("autoresearch.sessions") }}</h2>
        <p v-if="listError" class="ar-page__error">
          {{ t("autoresearch.loadFailed", { error: listError }) }}
        </p>
        <p v-else-if="!sessions.length && !corruptSessions.length" class="ar-page__muted">
          {{ t("autoresearch.noSessions") }}
        </p>
        <ul class="ar-page__list">
          <li v-for="item in sessions" :key="item.id">
            <RouterLink
              :to="`/autoresearch/${item.id}`"
              :class="[
                'ar-page__item',
                { 'ar-page__item--active': item.id === sessionId },
              ]"
            >
              <span class="ar-page__item-goal">{{ item.config.goal }}</span>
              <span class="ar-page__muted">
                {{ t(`autoresearch.status.${item.status}`) }} ·
                {{ formatMetricValue(item.baseline) }} →
                {{ formatMetricValue(item.best_value) }}
              </span>
            </RouterLink>
          </li>
          <li
            v-for="item in corruptSessions"
            :key="item.id"
            class="ar-page__item ar-page__item--corrupt"
            data-testid="corrupt-session"
          >
            <span class="ar-page__item-goal">{{ item.id }}</span>
            <span class="ar-page__muted">{{ t(`autoresearch.status.${item.status}`) }}</span>
            <span class="ar-page__muted ar-page__reason">{{ item.reason }}</span>
          </li>
        </ul>
      </aside>

      <main class="ar-page__main">
        <AutoresearchSessionView
          v-if="sessionId && session"
          :session="session"
          :busy-action="busyAction"
          :action-error="actionError"
          @action="onAction"
        />
        <p v-else-if="sessionId && loadError" class="ar-page__error">{{ loadError }}</p>
        <template v-else-if="!sessionId">
          <div class="ar-page__modes" role="tablist">
            <button
              v-for="item in MODES"
              :key="item"
              type="button"
              role="tab"
              :aria-selected="mode === item"
              :data-testid="`mode-${item}`"
              :class="['ar-page__mode', { 'ar-page__mode--active': mode === item }]"
              @click="selectMode(item)"
            >
              {{ t(`autoresearch.mode.${item}`) }}
            </button>
          </div>
          <AutoresearchPrerequisites :missing="missing" />
          <AutoresearchForm
            v-if="mode === 'custom'"
            :workspace-root="settings.form.workspace_root"
            :busy="starting"
            :error="formError"
            @submit="start"
          />
          <ImproveRolePromptForm
            v-else
            :preset="promptPreset"
            :load-error="promptPresetError"
            :busy="starting"
            :error="formError"
            @submit="startPromptImprovement"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";
import { buildAgentConfig } from "@/entities/agent-config";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import {
  createResearchSession,
  getImproveRolePromptPreset,
  listResearchSessions,
  startImproveRolePrompt,
  type CorruptResearchSession,
  type ImproveRolePromptPreset,
  type ResearchSession,
} from "@/shared/api/endpoints/autoresearch";
import {
  AutoresearchForm,
  AutoresearchPrerequisites,
  AutoresearchSessionView,
  ImproveRolePromptForm,
  formatMetricValue,
  missingPrerequisites,
  refusalBeyondPrerequisites,
  toCreateRequest,
  toImproveRolePromptRequest,
  useAutoresearchSession,
  type AutoresearchFormState,
  type PromptPresetFormState,
  type SessionAction,
} from "@/features/autoresearch";

type StartMode = "custom" | "prompt";
const MODES: StartMode[] = ["custom", "prompt"];

const props = defineProps<{ sessionId?: string }>();
const { t } = useI18n();
const router = useRouter();
const ux = useUxStore();
const settings = useInjectedAppSettings();

const sessions = ref<ResearchSession[]>([]);
const corruptSessions = ref<CorruptResearchSession[]>([]);
const listError = ref("");
const starting = ref(false);
const startError = ref("");
const globalSettings = useGlobalSearchKeys();
const { session, loadError, actionError, busyAction, open, close, run } =
  useAutoresearchSession();

async function loadList(): Promise<void> {
  try {
    const listed = await listResearchSessions();
    sessions.value = listed.sessions;
    corruptSessions.value = listed.corrupt_sessions;
    listError.value = "";
  } catch (error: unknown) {
    listError.value = error instanceof Error ? error.message : String(error);
  }
}

function goToNew(): void {
  void router.push("/autoresearch");
}

const mode = ref<StartMode>("custom");
const missing = computed(() =>
  missingPrerequisites(globalSettings.state, startError.value, mode.value === "custom"),
);
/** A refusal the prerequisite hints already explain is not repeated as raw text. */
const formError = computed(() => refusalBeyondPrerequisites(startError.value));
const promptPreset = ref<ImproveRolePromptPreset | null>(null);
const promptPresetError = ref("");

async function selectMode(next: StartMode): Promise<void> {
  mode.value = next;
  startError.value = "";
  if (next !== "prompt" || promptPreset.value) return;
  try {
    promptPreset.value = await getImproveRolePromptPreset();
    promptPresetError.value = "";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    promptPresetError.value = t("autoresearch.prompt.loadFailed", { error: message });
  }
}

async function launch(
  create: (agentConfig: Record<string, unknown>) => Promise<ResearchSession>,
): Promise<void> {
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return;
  starting.value = true;
  startError.value = "";
  try {
    const created = await create(agentConfig);
    await loadList();
    await router.push(`/autoresearch/${created.id}`);
  } catch (error: unknown) {
    startError.value = error instanceof Error ? error.message : String(error);
  } finally {
    starting.value = false;
  }
}

function start(state: AutoresearchFormState): Promise<void> {
  return launch((agentConfig) => createResearchSession(toCreateRequest(state, agentConfig)));
}

function startPromptImprovement(state: PromptPresetFormState): Promise<void> {
  return launch((agentConfig) =>
    startImproveRolePrompt(toImproveRolePromptRequest(state, agentConfig)),
  );
}

async function onAction(action: SessionAction): Promise<void> {
  if (action === "discard") {
    const confirmed = await ux.confirmDialog({
      title: t("autoresearch.actions.discard"),
      message: t("autoresearch.actions.discardConfirm"),
      confirmLabel: t("autoresearch.actions.discard"),
    });
    if (!confirmed) return;
  }
  if (await run(action)) await loadList();
}

function show(sessionId: string | undefined): void {
  void loadList();
  if (sessionId) void open(sessionId);
  else close();
}

watch(() => props.sessionId, show, { immediate: true });

watch(
  () => session.value?.status,
  (status, previous) => {
    if (previous && status !== previous) void loadList();
  },
);

// App.vue keeps pages alive: without this the hidden page would keep polling,
// and on return the list would still show what it held when the user left.
let hidden = false;
onDeactivated(() => {
  hidden = true;
  close();
});
onActivated(() => {
  if (!hidden) return;
  hidden = false;
  show(props.sessionId);
});
</script>

<style scoped>
.ar-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.ar-page__body {
  flex: 1 1 auto;
  display: flex;
  gap: 24px;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 32px 32px;
}

.ar-page__sidebar {
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ar-page__main {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 900px;
}

.ar-page__title {
  margin: 0;
  font-size: 18px;
}

.ar-page__subtitle,
.ar-page__muted {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.ar-page__heading {
  margin: 8px 0 0;
  font-size: 13px;
}

.ar-page__new {
  align-self: flex-start;
  padding: 5px 12px;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius);
  background: transparent;
  color: var(--accent-primary);
  cursor: pointer;
}

.ar-page__modes {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.ar-page__mode {
  padding: 5px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--text);
  cursor: pointer;
}

.ar-page__mode--active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.ar-page__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ar-page__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  text-decoration: none;
}

.ar-page__item--corrupt {
  border-color: var(--danger);
}

.ar-page__reason {
  overflow-wrap: anywhere;
}

.ar-page__item--active {
  border-color: var(--accent-primary);
}

.ar-page__item-goal {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ar-page__error {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
}
</style>
