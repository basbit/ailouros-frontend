<template>
  <ModelPickerField
    :label="label"
    :environment="env"
    :model-choices="choices"
    :model-sel="sel"
    :model-custom="sel === '__custom__' ? modelValue : ''"
    :model-fetch-error="err"
    :profile-options="profileOptions"
    :remote-profile="remoteProfile"
    :show-profile-select="showProfileSelect"
    :profile-placeholder="profilePlaceholder"
    :cloud-profile-title="cloudProfileTitle"
    :custom-placeholder="customPlaceholder"
    :env-code="envCode"
    @update:environment="onEnvChange"
    @update:remote-profile="(value: string) => emit('update:remoteProfile', value)"
    @update:model-sel="onModelSel"
    @update:model-custom="(value: string) => emit('update:modelValue', value)"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import {
  ensureModelChoicesForEnv,
  fetchCloudModelsFromConnection,
  fetchCloudModelsForProfile,
} from "@/shared/lib/use-model-list";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import ModelPickerField from "@/shared/components/ModelPickerField.vue";
import type { RemoteProfileRow } from "@/entities/project";

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
  profileOptions?: { value: string; label: string }[];
  remoteProfile?: string;
  profiles?: RemoteProfileRow[];
  profilePlaceholder?: string;
  cloudProfileTitle?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:provider": [value: string];
  "update:remoteProfile": [value: string];
}>();

const isDesktopShell = isDesktop();
const env = computed(() => props.provider || (isDesktopShell ? "local" : "ollama"));
const showProfileSelect = computed(
  () => env.value === "cloud" && Boolean(props.profileOptions?.length),
);
const choices = ref<[string, string][]>([["__custom__", "Custom…"]]);
const err = ref<string | null>(null);
const sel = ref("__custom__");

async function loadCloudChoices(): Promise<[string, string][]> {
  const selectedRow = (props.profiles ?? []).find(
    (row) => row.id === (props.remoteProfile ?? ""),
  );
  if (selectedRow) return fetchCloudModelsForProfile(selectedRow);
  return fetchCloudModelsFromConnection({
    provider: props.connection.remote_api_provider,
    api_key: props.connection.remote_api_key,
    base_url: props.connection.remote_api_base_url,
  });
}

async function loadModelChoices(): Promise<void> {
  err.value = null;
  try {
    if (env.value === "cloud") {
      choices.value = await loadCloudChoices();
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
    props.remoteProfile,
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
