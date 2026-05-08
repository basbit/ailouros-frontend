<template>
  <div v-if="visible" class="sudo-dialog" @click.self="onCancel">
    <form class="sudo-dialog__panel" @submit.prevent="onSubmit">
      <header class="sudo-dialog__head">
        <span class="sudo-dialog__title">{{ t("sudoPrompt.title") }}</span>
      </header>
      <p v-if="!props.allowed" class="sudo-dialog__warn">
        {{ t("sudoPrompt.disabled") }}
      </p>
      <div v-if="props.allowed" class="sudo-dialog__body">
        <pre class="sudo-dialog__cmd">{{ props.command }}</pre>
        <label class="sudo-dialog__field">
          <span>{{ t("sudoPrompt.passwordLabel") }}</span>
          <input
            ref="passwordRef"
            type="password"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('sudoPrompt.passwordPlaceholder')"
            :value="password"
            @input="onPasswordInput($event)"
          />
        </label>
      </div>
      <footer class="sudo-dialog__foot">
        <button type="button" class="sudo-dialog__cancel" @click="onCancel">
          {{ t("sudoPrompt.cancel") }}
        </button>
        <button
          v-if="props.allowed"
          type="submit"
          class="sudo-dialog__confirm"
          :disabled="password.length === 0"
        >
          {{ t("sudoPrompt.confirm") }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  visible: boolean;
  allowed: boolean;
  command: string;
}>();

const emit = defineEmits<{
  confirm: [password: string];
  cancel: [];
}>();

const { t } = useI18n();
const password = ref("");
const passwordRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      password.value = "";
      await nextTick();
      passwordRef.value?.focus();
    } else {
      password.value = "";
    }
  },
);

function onPasswordInput(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  password.value = target?.value ?? "";
}

function onSubmit(): void {
  if (!props.allowed) return;
  if (!password.value) return;
  emit("confirm", password.value);
  password.value = "";
}

function onCancel(): void {
  password.value = "";
  emit("cancel");
}
</script>

<style scoped>
.sudo-dialog {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}
.sudo-dialog__panel {
  background: var(--surface, #1a1d29);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  width: min(440px, 92vw);
  display: flex;
  flex-direction: column;
}
.sudo-dialog__head {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.sudo-dialog__title {
  font-weight: 700;
  font-size: 13px;
}
.sudo-dialog__warn {
  margin: 12px 14px;
  padding: 8px 10px;
  background: color-mix(in srgb, #d99f24 18%, transparent);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text, #f5f0e7);
}
.sudo-dialog__body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sudo-dialog__cmd {
  margin: 0;
  padding: 6px 8px;
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11px;
  background: var(--surface2, #14171f);
  border-radius: 6px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.sudo-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.sudo-dialog__field input {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface2, #14171f);
  color: var(--text, #f5f0e7);
  font-size: 13px;
}
.sudo-dialog__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--border, #2a2f3e);
}
.sudo-dialog__cancel,
.sudo-dialog__confirm {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.sudo-dialog__cancel {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  color: var(--text, #f5f0e7);
}
.sudo-dialog__confirm {
  background: var(--accent, #3b5bdb);
  border: 1px solid var(--accent, #3b5bdb);
  color: #fff;
}
.sudo-dialog__confirm:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
