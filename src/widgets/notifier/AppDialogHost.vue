<template>
  <div
    v-if="ux.dialog"
    class="dialog-backdrop"
    role="presentation"
    @click.self="cancel"
  >
    <section
      class="dialog-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="bodyId"
    >
      <header class="dialog-card__header">
        <h2 :id="titleId" class="dialog-card__title">{{ ux.dialog.title }}</h2>
      </header>
      <div :id="bodyId" class="dialog-card__body">
        <p>{{ ux.dialog.message }}</p>
        <input
          v-if="ux.dialog.kind === 'prompt'"
          ref="inputRef"
          v-model="promptValue"
          class="dialog-card__input"
          :placeholder="ux.dialog.placeholder || ''"
          @keydown.enter.prevent="confirm"
          @keydown.esc.prevent="cancel"
        />
      </div>
      <footer class="dialog-card__actions">
        <button
          v-if="ux.dialog.kind !== 'alert'"
          type="button"
          class="btn-ghost"
          @click="cancel"
        >
          {{ ux.dialog.cancelLabel || t("dialogs.cancel") }}
        </button>
        <button type="button" class="btn-primary" @click="confirm">
          {{ ux.dialog.confirmLabel || defaultConfirmLabel }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";

const ux = useUxStore();
const { t } = useI18n();
const promptValue = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const titleId = "app-dialog-title";
const bodyId = "app-dialog-body";

const defaultConfirmLabel = computed(() => {
  if (!ux.dialog) return t("dialogs.ok");
  return ux.dialog.kind === "confirm" ? t("dialogs.confirm") : t("dialogs.ok");
});

watch(
  () => ux.dialog,
  async (dialog) => {
    promptValue.value = dialog?.kind === "prompt" ? dialog.value || "" : "";
    if (dialog?.kind === "prompt") {
      await nextTick();
      inputRef.value?.focus();
      inputRef.value?.select();
    }
  },
  { immediate: true },
);

function confirm(): void {
  if (!ux.dialog) return;
  if (ux.dialog.kind === "prompt") {
    ux.closeDialog(promptValue.value.trim() || null);
    return;
  }
  ux.closeDialog(true);
}

function cancel(): void {
  if (!ux.dialog) return;
  if (ux.dialog.kind === "alert") {
    ux.closeDialog(true);
    return;
  }
  ux.closeDialog(false);
}
</script>
