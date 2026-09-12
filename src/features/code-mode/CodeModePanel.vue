<template>
  <section class="code-mode" :aria-label="t('codeMode.cardAria')">
    <header class="code-mode__header">
      <h3 class="code-mode__title">{{ t("codeMode.headline") }}</h3>
      <button
        type="button"
        class="code-mode__btn"
        :disabled="loadingStatus"
        @click="refreshStatus"
      >
        {{ t("codeMode.refresh") }}
      </button>
    </header>

    <p class="code-mode__hint">{{ t("codeMode.explainer") }}</p>

    <ul v-if="status" class="code-mode__gates">
      <li
        v-for="gate in gates"
        :key="gate.key"
        class="code-mode__gate"
        :class="gate.ok ? 'code-mode__gate--on' : 'code-mode__gate--off'"
      >
        {{ gate.label }}
      </li>
    </ul>

    <p v-if="blockedReason" class="code-mode__blocked">{{ blockedReason }}</p>

    <label class="code-mode__field">
      <span>{{ t("codeMode.language") }}</span>
      <select v-model="language" class="code-mode__select">
        <option v-for="name in languages" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
    </label>

    <label class="code-mode__field">
      <span>{{ t("codeMode.program") }}</span>
      <textarea
        v-model="program"
        class="code-mode__program"
        rows="8"
        spellcheck="false"
        :placeholder="t('codeMode.programPlaceholder')"
      ></textarea>
    </label>

    <label class="code-mode__field">
      <span>{{ t("codeMode.workspaceRoot") }}</span>
      <input v-model="workspaceRoot" class="code-mode__input" type="text" />
    </label>

    <label class="code-mode__checkbox">
      <input v-model="applyWrites" type="checkbox" />
      <span>{{ t("codeMode.applyWrites") }}</span>
    </label>

    <button
      type="button"
      class="code-mode__run"
      :disabled="!canRun"
      @click="run"
    >
      {{ running ? t("codeMode.running") : t("codeMode.run") }}
    </button>

    <p v-if="lastError" class="code-mode__error">{{ lastError }}</p>

    <div v-if="result" class="code-mode__result">
      <p class="code-mode__verdict">
        {{ t("codeMode.verdict") }}: {{ result.verdict }} ({{ result.exitCode }})
        — {{ result.profile }}
      </p>
      <pre v-if="result.stdout" class="code-mode__stream">{{ result.stdout }}</pre>
      <pre v-if="result.stderr" class="code-mode__stream code-mode__stream--err">{{
        result.stderr
      }}</pre>
      <p v-if="result.writeRefusal" class="code-mode__refusal">
        {{ result.writeRefusal }}
      </p>
      <p v-if="result.writtenPaths.length" class="code-mode__written">
        {{ t("codeMode.written") }}: {{ result.writtenPaths.join(", ") }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  getCodeModeStatus,
  runCodeMode,
  type CodeModeRunResult,
  type CodeModeStatus,
} from "@/shared/api/endpoints/code-mode";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

const status = ref<CodeModeStatus | null>(null);
const loadingStatus = ref(false);
const running = ref(false);
const lastError = ref("");
const result = ref<CodeModeRunResult | null>(null);
const language = ref("python");
const program = ref("");
const workspaceRoot = ref("");
const applyWrites = ref(false);

const languages = computed(() => status.value?.languages ?? ["node", "python"]);

const profileIsolating = computed(
  () => status.value?.profileIsolating?.[language.value] ?? false,
);

const gates = computed(() => {
  const current = status.value;
  if (!current) return [];
  return [
    {
      key: "enabled",
      ok: current.enabled,
      label: t("codeMode.gate.enabled"),
    },
    {
      key: "exec",
      ok: current.commandExecAllowed,
      label: t("codeMode.gate.exec"),
    },
    {
      key: "docker",
      ok: current.dockerAvailable,
      label: t("codeMode.gate.docker"),
    },
    {
      key: "isolating",
      ok: profileIsolating.value,
      label: t("codeMode.gate.isolating"),
    },
    {
      key: "write",
      ok: current.workspaceWriteAllowed,
      label: t("codeMode.gate.write"),
    },
  ];
});

const blockedReason = computed(() => {
  const current = status.value;
  if (!current) return "";
  if (!current.enabled) return t("codeMode.blocked.disabled");
  if (!current.commandExecAllowed) return t("codeMode.blocked.exec");
  if (!current.dockerAvailable) return t("codeMode.blocked.docker");
  if (!profileIsolating.value) return t("codeMode.blocked.isolating");
  return "";
});

const canRun = computed(
  () => !running.value && !blockedReason.value && program.value.trim().length > 0,
);

async function refreshStatus(): Promise<void> {
  loadingStatus.value = true;
  lastError.value = "";
  try {
    status.value = await getCodeModeStatus();
  } catch (error) {
    lastError.value = error instanceof Error ? error.message : String(error);
  } finally {
    loadingStatus.value = false;
  }
}

async function run(): Promise<void> {
  running.value = true;
  lastError.value = "";
  result.value = null;
  try {
    result.value = await runCodeMode({
      language: language.value,
      program: program.value,
      workspaceRoot: workspaceRoot.value,
      applyWrites: applyWrites.value,
    });
  } catch (error) {
    lastError.value = error instanceof Error ? error.message : String(error);
  } finally {
    running.value = false;
  }
}

onMounted(refreshStatus);

defineExpose({ refreshStatus });
</script>

<style scoped>
.code-mode {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.code-mode__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.code-mode__title {
  margin: 0;
  font-size: 15px;
}

.code-mode__hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.code-mode__gates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.code-mode__gate {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  border: 1px solid var(--line);
}

.code-mode__gate--on {
  color: var(--ok, #1a7f37);
}

.code-mode__gate--off {
  color: var(--muted);
}

.code-mode__blocked,
.code-mode__error,
.code-mode__refusal {
  margin: 0;
  color: var(--danger, #b42318);
  font-size: 12px;
  white-space: pre-wrap;
}

.code-mode__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.code-mode__checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.code-mode__program,
.code-mode__input,
.code-mode__select {
  font-family: var(--mono, monospace);
  font-size: 12px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: var(--r-md, 6px);
  background: var(--bg);
  color: inherit;
}

.code-mode__run,
.code-mode__btn {
  align-self: flex-start;
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md, 6px);
  background: var(--card);
  color: inherit;
  cursor: pointer;
}

.code-mode__run:disabled,
.code-mode__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.code-mode__stream {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: var(--r-md, 6px);
  font-size: 12px;
  white-space: pre-wrap;
}

.code-mode__stream--err {
  color: var(--danger, #b42318);
}

.code-mode__written {
  margin: 0;
  font-size: 12px;
}
</style>
