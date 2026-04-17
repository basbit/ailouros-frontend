<template>
  <div v-if="visible" class="human-gate shell-gate shell-gate--warning">
    <div class="human-gate-title shell-gate__title">
      &#9888; {{ t("shellGate.title") }}
    </div>
    <div class="shell-gate__code-block">
      <div v-if="loading" class="shell-gate__muted">{{ t("shellGate.loading") }}</div>
      <template v-else>
        <div v-if="!commands.length" class="shell-gate__muted">
          {{ t("shellGate.empty") }}
        </div>
        <div
          v-for="(cmd, i) in commands"
          :key="i"
          class="shell-gate__cmd"
          :class="{ 'shell-gate__cmd--needs-allowlist': isNeedsAllowlist(cmd) }"
        >
          {{ i + 1 }}. {{ cmd }}
        </div>
      </template>
    </div>

    <!-- allowlist extension notice -->
    <div v-if="(needsAllowlist ?? []).length" class="shell-gate__notice">
      {{ t("shellGate.needsAllowlist") }}:
      <code
        v-for="bin in needsAllowlist ?? []"
        :key="bin"
        class="shell-gate__pill shell-gate__pill--needs"
      >
        {{ bin }}
      </code>
    </div>
    <div v-if="(alreadyAllowed ?? []).length" class="shell-gate__subnotice">
      {{ t("shellGate.alreadyAllowed") }}:
      <code
        v-for="bin in alreadyAllowed ?? []"
        :key="bin"
        class="shell-gate__pill shell-gate__pill--ok"
      >
        {{ bin }}
      </code>
    </div>

    <div class="shell-gate__actions">
      <button
        v-if="commands.length"
        type="button"
        class="btn-primary btn-primary--success"
        @click="emit('confirm', true)"
      >
        {{ t("shellGate.allow") }}
      </button>
      <button
        type="button"
        class="btn-primary btn-primary--danger"
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

function isNeedsAllowlist(cmd: string): boolean {
  const binary = cmd.trim().split(/\s+/)[0] ?? "";
  return (props.needsAllowlist ?? []).includes(binary);
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

<style scoped>
.shell-gate--warning {
  border-color: var(--warning);
}
.shell-gate__title {
  color: var(--warning);
}
.shell-gate__code-block {
  margin-top: 8px;
  padding: 8px;
  font-family: var(--mono);
  font-size: 12px;
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}
.shell-gate__muted {
  color: var(--text3);
}
.shell-gate__cmd--needs-allowlist {
  color: var(--warning);
}
.shell-gate__notice {
  margin-top: 8px;
  font-size: 11px;
  color: var(--warning);
}
.shell-gate__subnotice {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text3);
}
.shell-gate__pill {
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: 3px;
  font-family: var(--mono);
}
.shell-gate__pill--needs {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--warning) 34%, transparent);
}
.shell-gate__pill--ok {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
}
.shell-gate__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
