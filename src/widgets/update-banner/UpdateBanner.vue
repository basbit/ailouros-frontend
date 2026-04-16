<template>
  <div v-if="visible" class="update-banner" role="status" aria-live="polite">
    <span class="update-banner__dot" aria-hidden="true">●</span>
    <span class="update-banner__text">
      {{ t("updateBanner.text", { behind: status.behind, branch: status.branch }) }}
    </span>
    <button
      type="button"
      class="update-banner__dismiss"
      :title="t('updateBanner.dismiss')"
      @click="dismiss"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";

interface UpdateStatus {
  checked: boolean;
  unknown: boolean;
  behind: number;
  ahead: number;
  current_ref: string;
  remote_ref: string;
  branch: string;
  reason?: string;
}

const { t } = useI18n();

const LS_KEY = "swarm.update-banner-dismissed-ref";
const status = ref<UpdateStatus>({
  checked: false,
  unknown: true,
  behind: 0,
  ahead: 0,
  current_ref: "",
  remote_ref: "",
  branch: "",
});
const dismissedRef = ref<string>(localStorage.getItem(LS_KEY) ?? "");

const visible = computed(() => {
  const s = status.value;
  if (!s.checked || s.unknown || s.behind <= 0) return false;
  // Re-show the banner if the remote has moved on since the user dismissed.
  return s.remote_ref !== dismissedRef.value;
});

async function fetchStatus(): Promise<void> {
  try {
    const r = await fetch(apiUrl("/v1/system/update-available"));
    if (!r.ok) return;
    status.value = (await r.json()) as UpdateStatus;
  } catch (e) {
    // Best-effort; endpoint is optional. No banner on network error.
    console.debug("[update-banner] fetch failed:", e);
  }
}

function dismiss(): void {
  dismissedRef.value = status.value.remote_ref;
  localStorage.setItem(LS_KEY, status.value.remote_ref);
}

onMounted(() => {
  // Wait a tick so backend lifespan startup has time to kick off the check.
  setTimeout(() => {
    void fetchStatus();
  }, 1500);
});
</script>

<style scoped>
.update-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--bg2, #1e2230);
  border-bottom: 1px solid var(--accent, #3b5bdb);
  font-size: 13px;
  color: var(--text1, #c8cfe8);
}
.update-banner__dot {
  color: var(--accent, #3b5bdb);
  font-size: 10px;
}
.update-banner__text {
  flex: 1;
}
.update-banner__dismiss {
  background: transparent;
  border: none;
  color: var(--text2, #9dadd0);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 2px 6px;
}
.update-banner__dismiss:hover {
  color: var(--text1, #c8cfe8);
}
</style>
