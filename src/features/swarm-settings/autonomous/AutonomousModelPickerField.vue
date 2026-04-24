<template>
  <div class="field">
    <label class="field-label">{{ label }}</label>
    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap">
      <select
        :value="env"
        @change="onEnvChange(($event.target as HTMLSelectElement).value)"
      >
        <option value="ollama">ollama</option>
        <option value="lmstudio">lmstudio</option>
        <option value="cloud">cloud</option>
      </select>
      <span v-if="err" class="model-fetch-error" :title="err">⚠ {{ err }}</span>
      <select
        v-else
        :value="sel"
        @change="onModelSel(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="[val, lbl] in choices" :key="val" :value="val">
          {{ lbl }}
        </option>
      </select>
    </div>
    <input
      v-if="sel === '__custom__'"
      type="text"
      :placeholder="customPlaceholder"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <div v-if="envCode" class="hint">
      Env: <code>{{ envCode }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  ensureModelChoicesForEnv,
  fetchCloudModelsFromConnection,
} from "@/shared/lib/use-model-list";

interface CloudConnection {
  remote_api_provider: string;
  remote_api_key: string;
  remote_api_base_url: string;
}

const props = defineProps<{
  label: string;
  provider: string;
  modelValue: string;
  connection: CloudConnection;
  customPlaceholder?: string;
  envCode?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:provider": [value: string];
}>();

const env = computed(() => props.provider || "ollama");
const choices = ref<[string, string][]>([["__custom__", "Custom…"]]);
const err = ref<string | null>(null);
const sel = ref("__custom__");

async function loadModelChoices(): Promise<void> {
  err.value = null;
  try {
    if (env.value === "cloud") {
      choices.value = await fetchCloudModelsFromConnection({
        provider: props.connection.remote_api_provider,
        api_key: props.connection.remote_api_key,
        base_url: props.connection.remote_api_base_url,
      });
      return;
    }
    choices.value = await ensureModelChoicesForEnv(env.value);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
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

function syncSel(model: string): void {
  const found = choices.value.find(([v]) => v === model && v !== "__custom__");
  sel.value = found ? found[0] : "__custom__";
}

let loadId = 0;
async function reload(): Promise<void> {
  const id = ++loadId;
  await loadModelChoices();
  if (id !== loadId) return;
  syncSel(props.modelValue);
}

watch(env, async () => reload(), { immediate: true });
watch(
  () => [
    props.connection.remote_api_provider,
    props.connection.remote_api_base_url,
    props.connection.remote_api_key,
  ],
  async () => {
    if (env.value === "cloud") await reload();
  },
);
watch(
  () => props.modelValue,
  (m) => syncSel(m),
);

function onEnvChange(value: string): void {
  emit("update:provider", value);
}
function onModelSel(value: string): void {
  sel.value = value;
  if (value !== "__custom__") emit("update:modelValue", value);
}
</script>
