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
        max-height: 160px;
        overflow-y: auto;
      "
    >
      <div v-if="loading" style="color: var(--text3)">{{ t("shellGate.loading") }}</div>
      <div v-else-if="!commands.length" style="color: var(--text3)">
        {{ t("shellGate.empty") }}
      </div>
      <div v-for="(cmd, i) in commands" :key="i">{{ i + 1 }}. {{ cmd }}</div>
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
}>();
const emit = defineEmits<{
  confirm: [approved: boolean];
}>();

const { t } = useI18n();

const loading = ref(true);

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
      // Give backend 5s to populate commands, then stop loading
      setTimeout(() => {
        loading.value = false;
      }, 5000);
    }
  },
);
</script>
