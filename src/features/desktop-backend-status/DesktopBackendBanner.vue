<template>
  <Teleport to="body">
    <div v-if="state.visible.value" class="dbs-banner" role="alert">
      <div class="dbs-banner__content">
        <strong class="dbs-banner__title">
          {{ t("desktopBackendBanner.title") }}
        </strong>
        <p class="dbs-banner__message">{{ state.message.value }}</p>
        <p v-if="state.lastError.value" class="dbs-banner__error">
          {{ state.lastError.value }}
        </p>
        <details v-if="state.logTail.value" class="dbs-banner__details">
          <summary>{{ t("desktopBackendBanner.showLog") }}</summary>
          <pre>{{ state.logTail.value }}</pre>
        </details>
      </div>
      <div class="dbs-banner__actions">
        <button
          type="button"
          class="dbs-banner__btn dbs-banner__btn--primary"
          :disabled="state.retrying.value"
          @click="state.retry()"
        >
          {{
            state.retrying.value
              ? t("desktopBackendBanner.retrying")
              : t("desktopBackendBanner.retry")
          }}
        </button>
        <button type="button" class="dbs-banner__btn" @click="state.openLogs()">
          {{ t("desktopBackendBanner.openLogs") }}
        </button>
        <button
          type="button"
          class="dbs-banner__btn dbs-banner__btn--ghost"
          aria-label="Dismiss"
          @click="state.dismiss()"
        >
          ×
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useDesktopBackendStatus } from "./useDesktopBackendStatus";

const { t } = useI18n();
const state = useDesktopBackendStatus();

onMounted(() => {
  void state.start();
});

onBeforeUnmount(() => {
  state.dispose();
});
</script>

<style scoped>
.dbs-banner {
  position: fixed;
  inset: auto 16px 16px 16px;
  z-index: 999;
  background: #1f2937;
  color: #f9fafb;
  border-radius: 10px;
  border: 1px solid #b91c1c;
  padding: 0.85rem 1rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: start;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  font-size: 0.85rem;
}
.dbs-banner__content {
  min-width: 0;
}
.dbs-banner__title {
  display: block;
  color: #fca5a5;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.25rem;
}
.dbs-banner__message {
  margin: 0;
  word-break: break-word;
}
.dbs-banner__error {
  margin: 0.25rem 0 0;
  color: #fca5a5;
  font-size: 0.78rem;
  word-break: break-word;
}
.dbs-banner__details {
  margin-top: 0.4rem;
  font-size: 0.78rem;
}
.dbs-banner__details summary {
  cursor: pointer;
  color: #fde68a;
}
.dbs-banner__details pre {
  margin-top: 0.4rem;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  max-height: 14rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
.dbs-banner__actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: stretch;
}
.dbs-banner__btn {
  background: transparent;
  color: #f9fafb;
  border: 1px solid #4b5563;
  border-radius: 6px;
  padding: 0.4rem 0.7rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.dbs-banner__btn:hover:not(:disabled) {
  border-color: #f9fafb;
}
.dbs-banner__btn:disabled {
  opacity: 0.6;
  cursor: progress;
}
.dbs-banner__btn--primary {
  background: #b91c1c;
  border-color: #b91c1c;
}
.dbs-banner__btn--primary:hover:not(:disabled) {
  background: #991b1b;
  border-color: #991b1b;
}
.dbs-banner__btn--ghost {
  font-size: 1.1rem;
  line-height: 1;
  padding: 0.2rem 0.5rem;
  border-color: transparent;
}
</style>
