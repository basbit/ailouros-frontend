<template>
  <div class="autonomous-settings-fields">
    <!-- Swarm Topology -->
    <div class="field">
      <label class="field-label" for="swarm_topology">{{
        t("auto.topologyLabel")
      }}</label>
      <select
        id="swarm_topology"
        :value="form.swarm_topology"
        @change="
          emit(
            'update:form',
            'swarm_topology',
            ($event.target as HTMLSelectElement).value,
          )
        "
      >
        <option value="">{{ t("auto.topology.linear") }}</option>
        <option value="parallel">{{ t("auto.topology.parallel") }}</option>
        <option value="hierarchical">{{ t("auto.topology.hierarchical") }}</option>
        <option value="ring">{{ t("auto.topology.ring") }}</option>
        <option value="mesh">{{ t("auto.topology.mesh") }}</option>
      </select>
      <div class="hint">{{ t("auto.topologyHint") }}</div>
    </div>

    <!-- Self-Verify -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_self_verify"
          type="checkbox"
          :checked="form.swarm_self_verify"
          @change="
            emit(
              'update:form',
              'swarm_self_verify',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.selfVerifyLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.selfVerifyHint") }}
        <code>SWARM_SELF_VERIFY</code>.
      </div>
    </div>
    <div class="field">
      <label class="field-label">{{ t("auto.selfVerifyModelLabel") }}</label>
      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap">
        <select
          :value="svEnv"
          @change="onSvEnvChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="ollama">ollama</option>
          <option value="lmstudio">lmstudio</option>
          <option value="cloud">cloud</option>
        </select>
        <span v-if="svErr" class="model-fetch-error" :title="svErr">⚠ {{ svErr }}</span>
        <select
          v-else
          :value="svSel"
          @change="onSvModelSel(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="[val, lbl] in svChoices" :key="val" :value="val">
            {{ lbl }}
          </option>
        </select>
      </div>
      <input
        v-if="svSel === '__custom__'"
        type="text"
        :placeholder="t('auto.modelIdPlaceholder')"
        :value="form.swarm_self_verify_model"
        @input="
          emit(
            'update:form',
            'swarm_self_verify_model',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">Env: <code>SWARM_SELF_VERIFY_MODEL</code></div>
    </div>

    <!-- Auto-Approve -->
    <div class="field">
      <label class="field-label" for="swarm_auto_approve">{{
        t("auto.autoApproveLabel")
      }}</label>
      <select
        id="swarm_auto_approve"
        :value="form.swarm_auto_approve"
        @change="
          emit(
            'update:form',
            'swarm_auto_approve',
            ($event.target as HTMLSelectElement).value,
          )
        "
      >
        <option value="">{{ t("auto.autoApprove.default") }}</option>
        <option value="0">{{ t("auto.autoApprove.off") }}</option>
        <option value="policy">{{ t("auto.autoApprove.policy") }}</option>
        <option value="1">{{ t("auto.autoApprove.on") }}</option>
      </select>
      <div class="hint">Env: <code>SWARM_AUTO_APPROVE</code></div>
    </div>
    <div class="field">
      <label class="field-label" for="swarm_auto_approve_timeout">{{
        t("auto.autoApproveTimeoutLabel")
      }}</label>
      <input
        id="swarm_auto_approve_timeout"
        type="number"
        min="0"
        placeholder="3600"
        :value="form.swarm_auto_approve_timeout"
        @input="
          emit(
            'update:form',
            'swarm_auto_approve_timeout',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">
        {{ t("auto.autoApproveTimeoutHint") }}
        <code>SWARM_AUTO_APPROVE_TIMEOUT_SECONDS</code>
      </div>
    </div>

    <!-- Auto-Retry on NEEDS_WORK -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_auto_retry"
          type="checkbox"
          :checked="form.swarm_auto_retry"
          @change="
            emit(
              'update:form',
              'swarm_auto_retry',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.autoRetryLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.autoRetryHint") }}
        <code>SWARM_AUTO_RETRY_ON_NEEDS_WORK</code>
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="swarm_max_step_retries">{{
        t("auto.maxRetriesLabel")
      }}</label>
      <input
        id="swarm_max_step_retries"
        type="number"
        min="1"
        max="10"
        placeholder="2"
        :value="form.swarm_max_step_retries"
        @input="
          emit(
            'update:form',
            'swarm_max_step_retries',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">Env: <code>SWARM_MAX_STEP_RETRIES</code></div>
    </div>

    <!-- Deep Planning -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_deep_planning"
          type="checkbox"
          :checked="form.swarm_deep_planning"
          @change="
            emit(
              'update:form',
              'swarm_deep_planning',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.deepPlanningLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.deepPlanningHint") }}
        Env: <code>SWARM_DEEP_PLANNING</code>
      </div>
    </div>
    <div class="field">
      <label class="field-label">{{ t("auto.deepPlanningModelLabel") }}</label>
      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap">
        <select
          :value="dpEnv"
          @change="onDpEnvChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="ollama">ollama</option>
          <option value="lmstudio">lmstudio</option>
          <option value="cloud">cloud</option>
        </select>
        <span v-if="dpErr" class="model-fetch-error" :title="dpErr">⚠ {{ dpErr }}</span>
        <select
          v-else
          :value="dpSel"
          @change="onDpModelSel(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="[val, lbl] in dpChoices" :key="val" :value="val">
            {{ lbl }}
          </option>
        </select>
      </div>
      <input
        v-if="dpSel === '__custom__'"
        type="text"
        :placeholder="t('auto.modelIdPlaceholder')"
        :value="form.swarm_deep_planning_model"
        @input="
          emit(
            'update:form',
            'swarm_deep_planning_model',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">Env: <code>SWARM_DEEP_PLANNING_MODEL</code></div>
    </div>

    <!-- Background Agent -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_background_agent"
          type="checkbox"
          :checked="form.swarm_background_agent"
          @change="
            emit(
              'update:form',
              'swarm_background_agent',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.backgroundAgentLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.backgroundAgentHint") }}
        <em>{{ t("auto.experimentalHint") }}</em>
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="swarm_background_watch_paths">{{
        t("auto.watchPathsLabel")
      }}</label>
      <input
        id="swarm_background_watch_paths"
        type="text"
        placeholder="src,tests"
        :value="form.swarm_background_watch_paths"
        @input="
          emit(
            'update:form',
            'swarm_background_watch_paths',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">
        {{ t("auto.watchPathsHint") }}
        <code>SWARM_BACKGROUND_AGENT_WATCH_PATHS</code>
      </div>
    </div>

    <!-- Memory Consolidation -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_dream_enabled"
          type="checkbox"
          :checked="form.swarm_dream_enabled"
          @change="
            emit(
              'update:form',
              'swarm_dream_enabled',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.memoryConsolidationLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.memoryConsolidationHint") }}
        <em>{{ t("auto.experimentalHint") }}</em>
      </div>
    </div>

    <!-- Quality Gate -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_quality_gate"
          type="checkbox"
          :checked="form.swarm_quality_gate"
          @change="
            emit(
              'update:form',
              'swarm_quality_gate',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.qualityGateLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.qualityGateHint") }}
        <code>SWARM_AUTO_RETRY_ON_NEEDS_WORK</code>.
      </div>
    </div>

    <!-- Force re-run (cache bypass) -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_force_rerun"
          type="checkbox"
          :checked="form.swarm_force_rerun"
          @change="
            emit(
              'update:form',
              'swarm_force_rerun',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.forceRerunLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.forceRerunHint") }}
        <code>swarm.force_rerun</code>.
      </div>
    </div>

    <!-- Auto-planner -->
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_auto_plan"
          type="checkbox"
          :checked="form.swarm_auto_plan"
          @change="
            emit(
              'update:form',
              'swarm_auto_plan',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("auto.autoPlanLabel") }}</span>
      </label>
      <div class="hint">
        {{ t("auto.autoPlanHint") }}
      </div>
    </div>
    <div v-if="form.swarm_auto_plan" class="field">
      <label class="field-label">{{ t("auto.plannerModelLabel") }}</label>
      <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap">
        <select
          :value="apEnv"
          @change="onApEnvChange(($event.target as HTMLSelectElement).value)"
        >
          <option value="ollama">ollama</option>
          <option value="lmstudio">lmstudio</option>
          <option value="cloud">cloud</option>
        </select>
        <span v-if="apErr" class="model-fetch-error" :title="apErr">⚠ {{ apErr }}</span>
        <select
          v-else
          :value="apSel"
          @change="onApModelSel(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="[val, lbl] in apChoices" :key="val" :value="val">
            {{ lbl }}
          </option>
        </select>
      </div>
      <input
        v-if="apSel === '__custom__'"
        type="text"
        placeholder="deepseek-r1:14b"
        :value="form.swarm_planner_model"
        @input="
          emit(
            'update:form',
            'swarm_planner_model',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  ensureModelChoicesForEnv,
  fetchCloudModelsFromConnection,
} from "@/shared/lib/use-model-list";
import { useI18n } from "@/shared/lib/i18n";

interface AutonomousFormSlice {
  swarm_topology: string;
  swarm_self_verify: boolean;
  swarm_self_verify_model: string;
  swarm_self_verify_provider: string;
  swarm_auto_approve: string;
  swarm_auto_approve_timeout: string;
  swarm_auto_retry: boolean;
  swarm_max_step_retries: string;
  swarm_deep_planning: boolean;
  swarm_deep_planning_model: string;
  swarm_deep_planning_provider: string;
  swarm_background_agent: boolean;
  swarm_background_watch_paths: string;
  swarm_dream_enabled: boolean;
  swarm_quality_gate: boolean;
  swarm_auto_plan: boolean;
  swarm_planner_model: string;
  swarm_planner_provider: string;
  swarm_force_rerun: boolean;
  remote_api_provider: string;
  remote_api_key: string;
  remote_api_base_url: string;
}

const props = defineProps<{ form: AutonomousFormSlice }>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
const { t } = useI18n();

// ── Model picker for Self-verify ─────────────────────────────────────────────
const svEnv = computed(() => props.form.swarm_self_verify_provider || "ollama");
const svChoices = ref<[string, string][]>([["__custom__", "Custom…"]]);
const svErr = ref<string | null>(null);
const svSel = ref("__custom__");

// ── Model picker for Deep planning ───────────────────────────────────────────
const dpEnv = computed(() => props.form.swarm_deep_planning_provider || "ollama");
const dpChoices = ref<[string, string][]>([["__custom__", "Custom…"]]);
const dpErr = ref<string | null>(null);
const dpSel = ref("__custom__");

// ── Model picker for Auto-planner ────────────────────────────────────────────
const apEnv = computed(() => props.form.swarm_planner_provider || "ollama");
const apChoices = ref<[string, string][]>([["__custom__", "Custom…"]]);
const apErr = ref<string | null>(null);
const apSel = ref("__custom__");

async function loadModelChoices(
  env: string,
  choices: typeof svChoices,
  err: typeof svErr,
): Promise<void> {
  err.value = null;
  try {
    if (env === "cloud") {
      choices.value = await fetchCloudModelsFromConnection({
        provider: props.form.remote_api_provider,
        api_key: props.form.remote_api_key,
        base_url: props.form.remote_api_base_url,
      });
      return;
    }
    choices.value = await ensureModelChoicesForEnv(env);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Connection refused = service not running; show custom input silently (no error badge)
    if (
      msg.includes("Connection refused") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("fetch")
    ) {
      choices.value = [["__custom__", "Custom…"]];
      err.value = null;
    } else {
      err.value = msg;
      choices.value = [["__custom__", "Custom…"]];
    }
  }
}

function syncModelSel(
  model: string,
  choices: typeof svChoices,
  sel: typeof svSel,
): void {
  const found = choices.value.find(([v]) => v === model && v !== "__custom__");
  sel.value = found ? found[0] : "__custom__";
}

// load IDs: cancel stale responses when provider switches rapidly
let svLoadId = 0;
let dpLoadId = 0;
let apLoadId = 0;

async function reloadSvChoices(): Promise<void> {
  const id = ++svLoadId;
  await loadModelChoices(svEnv.value, svChoices, svErr);
  if (id !== svLoadId) return;
  syncModelSel(props.form.swarm_self_verify_model, svChoices, svSel);
}

async function reloadDpChoices(): Promise<void> {
  const id = ++dpLoadId;
  await loadModelChoices(dpEnv.value, dpChoices, dpErr);
  if (id !== dpLoadId) return;
  syncModelSel(props.form.swarm_deep_planning_model, dpChoices, dpSel);
}

async function reloadApChoices(): Promise<void> {
  const id = ++apLoadId;
  await loadModelChoices(apEnv.value, apChoices, apErr);
  if (id !== apLoadId) return;
  syncModelSel(props.form.swarm_planner_model, apChoices, apSel);
}

watch(svEnv, async () => reloadSvChoices(), { immediate: true });
watch(dpEnv, async () => reloadDpChoices(), { immediate: true });
watch(apEnv, async () => reloadApChoices(), { immediate: true });
watch(
  () => [
    props.form.remote_api_provider,
    props.form.remote_api_base_url,
    props.form.remote_api_key,
  ],
  async () => {
    if (svEnv.value === "cloud") await reloadSvChoices();
    if (dpEnv.value === "cloud") await reloadDpChoices();
    if (apEnv.value === "cloud") await reloadApChoices();
  },
);
watch(
  () => props.form.swarm_self_verify_model,
  (m) => syncModelSel(m, svChoices, svSel),
);
watch(
  () => props.form.swarm_deep_planning_model,
  (m) => syncModelSel(m, dpChoices, dpSel),
);
watch(
  () => props.form.swarm_planner_model,
  (m) => syncModelSel(m, apChoices, apSel),
);

function onSvEnvChange(env: string): void {
  emit("update:form", "swarm_self_verify_provider", env);
}
function onSvModelSel(val: string): void {
  svSel.value = val;
  if (val !== "__custom__") emit("update:form", "swarm_self_verify_model", val);
}

function onDpEnvChange(env: string): void {
  emit("update:form", "swarm_deep_planning_provider", env);
}
function onDpModelSel(val: string): void {
  dpSel.value = val;
  if (val !== "__custom__") emit("update:form", "swarm_deep_planning_model", val);
}

function onApEnvChange(env: string): void {
  emit("update:form", "swarm_planner_provider", env);
}
function onApModelSel(val: string): void {
  apSel.value = val;
  if (val !== "__custom__") emit("update:form", "swarm_planner_model", val);
}

// onMounted removed: watches with { immediate: true } handle initial load.
// This avoids a spurious fetch from the default "ollama" provider before
// settings.init() applies the saved snap (which can set a different provider).
</script>
