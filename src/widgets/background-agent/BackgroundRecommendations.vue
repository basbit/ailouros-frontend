<template>
  <div v-if="visible" class="bg-recs">
    <div class="bg-recs__header">
      <span class="bg-recs__title">&#9862; {{ t("bgAgent.title") }}</span>
      <button class="bg-recs__dismiss-all" @click="dismissAll">
        {{ t("bgAgent.dismissAll") }}
      </button>
    </div>
    <div
      v-for="(rec, i) in items"
      :key="i"
      class="bg-recs__card"
      :class="`bg-recs__card--${rec.severity}`"
    >
      <div class="bg-recs__card-top">
        <span class="bg-recs__severity">{{ rec.severity }}</span>
        <span class="bg-recs__path">{{ rec.path }}</span>
        <button class="bg-recs__close" @click="dismiss(i)">&#x2715;</button>
      </div>
      <p class="bg-recs__message">{{ rec.message }}</p>
      <p v-if="rec.suggested_action" class="bg-recs__action">
        &#8627; {{ rec.suggested_action }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";

interface Recommendation {
  event_type: string;
  path: string;
  message: string;
  severity: "info" | "warning" | "error";
  suggested_action: string;
  timestamp: number;
}

const props = defineProps<{ enabled: boolean }>();
const { t } = useI18n();

const items = ref<Recommendation[]>([]);
const visible = computed(() => items.value.length > 0);

let timer: ReturnType<typeof setInterval> | null = null;

async function poll(): Promise<void> {
  if (!props.enabled) return;
  try {
    const r = await fetch(apiUrl("/v1/background-recommendations"));
    if (!r.ok) return;
    const data = await r.json();
    if (
      data.active &&
      Array.isArray(data.recommendations) &&
      data.recommendations.length
    ) {
      items.value = [...items.value, ...data.recommendations];
    }
  } catch {
    // network errors are silently ignored for background polling
  }
}

function dismiss(i: number): void {
  items.value.splice(i, 1);
}

function dismissAll(): void {
  items.value = [];
}

onMounted(() => {
  if (props.enabled) {
    void poll();
    timer = setInterval(poll, 10_000);
  }
});

onUnmounted(() => {
  if (timer !== null) clearInterval(timer);
});
</script>

<style scoped>
.bg-recs {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bg-recs__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text2, #9dadd0);
}
.bg-recs__title {
  font-weight: 600;
  letter-spacing: 0.03em;
}
.bg-recs__dismiss-all {
  background: none;
  border: none;
  color: var(--text2, #9dadd0);
  cursor: pointer;
  font-size: 11px;
  padding: 0;
}
.bg-recs__dismiss-all:hover {
  color: var(--text1, #c8cfe8);
}
.bg-recs__card {
  border-radius: 6px;
  padding: 8px 10px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg2, #1e2230);
  position: relative;
}
.bg-recs__card--warning {
  border-color: #e67700;
}
.bg-recs__card--error {
  border-color: #c92a2a;
}
.bg-recs__card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.bg-recs__severity {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text2, #9dadd0);
  .bg-recs__card--warning & {
    color: #e67700;
  }
  .bg-recs__card--error & {
    color: #c92a2a;
  }
}
.bg-recs__path {
  flex: 1;
  font-size: 11px;
  color: var(--text2, #9dadd0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bg-recs__close {
  background: none;
  border: none;
  color: var(--text2, #9dadd0);
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  line-height: 1;
}
.bg-recs__close:hover {
  color: var(--text1, #c8cfe8);
}
.bg-recs__message {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--text1, #c8cfe8);
}
.bg-recs__action {
  margin: 0;
  font-size: 11px;
  color: var(--text2, #9dadd0);
  font-style: italic;
}
</style>
