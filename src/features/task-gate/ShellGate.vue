<template>
  <div v-if="visible" class="human-gate" style="border-color: #e6a817">
    <div class="human-gate-title" style="color: #e6a817">
      &#9888; {{ t("shellGate.title") }}
    </div>
    <div
      style="
        margin-top: 8px;
        font-family: monospace;
        font-size: 12px;
        background: #1a1a1a;
        padding: 8px;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
      "
    >
      <div v-if="loading" style="color: var(--text3)">{{ t("shellGate.loading") }}</div>
      <template v-else>
        <div v-if="!commands.length" style="color: var(--text3)">
          {{ t("shellGate.empty") }}
        </div>
        <div v-for="(cmd, i) in commands" :key="i" :style="cmdStyle(cmd)">
          {{ i + 1 }}. {{ cmd }}
        </div>
      </template>
    </div>

    <!-- allowlist extension notice -->
    <div
      v-if="(needsAllowlist ?? []).length"
      style="margin-top: 8px; font-size: 11px; color: #e6a817"
    >
      {{ t("shellGate.needsAllowlist") }}:
      <code
        v-for="bin in needsAllowlist ?? []"
        :key="bin"
        style="
          margin-left: 4px;
          background: #2a2200;
          padding: 1px 4px;
          border-radius: 3px;
          border: 1px solid #e6a81755;
        "
        >{{ bin }}</code
      >
    </div>
    <div
      v-if="(alreadyAllowed ?? []).length"
      style="margin-top: 4px; font-size: 11px; color: var(--text3)"
    >
      {{ t("shellGate.alreadyAllowed") }}:
      <code
        v-for="bin in alreadyAllowed ?? []"
        :key="bin"
        style="
          margin-left: 4px;
          background: #1a2a1a;
          padding: 1px 4px;
          border-radius: 3px;
        "
        >{{ bin }}</code
      >
    </div>

    <div style="display: flex; gap: 8px; margin-top: 10px">
      <button
        v-if="commands.length"
        type="button"
        class="btn-primary"
        style="background: #2a7a2a"
        @click="emit('confirm', true)"
      >
        {{ t("shellGate.allow") }}
      </button>
      <button
        type="button"
        class="btn-primary"
        style="background: #7a2a2a"
        @click="emit('confirm', false)"
      >
        {{ commands.length ? t("shellGate.reject") : t("shellGate.dismiss") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  visible: boolean;
  commands: string[];
  needsAllowlist?: string[];
  alreadyAllowed?: string[];
}>();
const emit = defineEmits<{
  confirm: [approved: boolean];
}>();

const { t } = useI18n();

const loading = ref(true);

function cmdStyle(cmd: string): Record<string, string> {
  const binary = cmd.trim().split(/\s+/)[0] ?? "";
  const inNeeds = (props.needsAllowlist ?? []).includes(binary);
  return inNeeds ? { color: "#e6c84a" } : {};
}

watch(
  () => props.commands,
  (cmds) => {
    if (cmds.length > 0) loading.value = false;
  },
);
watch(
  () => props.visible,
  (v) => {
    if (v) {
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
      }, 5000);
    }
  },
);
</script>
