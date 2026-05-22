<template>
  <section class="system-health">
    <header class="sh-header">
      <span class="sh-title">System health</span>
      <span class="sh-aggregate" :class="`sh-aggregate--${aggregate}`">
        {{ aggregate.toUpperCase() }}
      </span>
      <button
        type="button"
        class="sh-refresh"
        :disabled="state.loading.value"
        @click="state.reload()"
      >
        {{ state.loading.value ? "…" : "Refresh" }}
      </button>
    </header>

    <p v-if="state.notImplemented.value" class="sh-empty">
      Health endpoint not available on this server.
    </p>
    <p v-else-if="state.error.value" class="sh-error">
      {{ state.error.value }}
    </p>
    <ul v-else class="sh-list">
      <li v-for="sub in state.subsystems.value" :key="sub.subsystem" class="sh-item">
        <button
          type="button"
          class="sh-item-toggle"
          :aria-expanded="expanded[sub.subsystem] ? 'true' : 'false'"
          @click="toggle(sub.subsystem)"
        >
          <span class="sh-dot" :class="`sh-dot--${sub.status}`"></span>
          <span class="sh-name">{{ sub.subsystem }}</span>
          <span class="sh-status">{{ sub.status }}</span>
          <span class="sh-latency">{{ sub.latency_ms.toFixed(1) }} ms</span>
        </button>
        <div v-if="expanded[sub.subsystem]" class="sh-details">
          <p class="sh-detail">{{ sub.detail || "—" }}</p>
          <dl v-if="hasMetadata(sub)" class="sh-meta">
            <template v-for="[key, value] in metadataPairs(sub)" :key="key">
              <dt>{{ key }}</dt>
              <dd>{{ value }}</dd>
            </template>
          </dl>
        </div>
      </li>
      <li v-if="state.subsystems.value.length === 0" class="sh-empty">
        No subsystems reported.
      </li>
    </ul>
    <footer v-if="state.lastUpdatedAt.value" class="sh-footer">
      Last updated {{ relativeUpdatedAt }}
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useSystemHealth } from "@/features/system-health/useSystemHealth";
import type { SubsystemHealth } from "@/shared/api/endpoints/health";

const props = defineProps<{
  pollIntervalMs?: number;
}>();

const state = useSystemHealth(props.pollIntervalMs ?? 30_000);
void state.reload();

const expanded = reactive<Record<string, boolean>>({});

function toggle(name: string): void {
  expanded[name] = !expanded[name];
}

function hasMetadata(sub: SubsystemHealth): boolean {
  return sub.metadata && Object.keys(sub.metadata).length > 0;
}

function metadataPairs(sub: SubsystemHealth): [string, string][] {
  return Object.entries(sub.metadata ?? {}) as [string, string][];
}

const aggregate = computed(() => state.status.value ?? "unknown");

const relativeUpdatedAt = computed(() => {
  const ts = state.lastUpdatedAt.value;
  if (!ts) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  return `${Math.round(diffSec / 60)}m ago`;
});
</script>

<style scoped>
.system-health {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  min-width: 280px;
  max-width: 480px;
}
.sh-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sh-title {
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.02em;
}
.sh-aggregate {
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  text-transform: uppercase;
}
.sh-aggregate--ok {
  color: var(--success, #4ade80);
  border-color: rgba(74, 222, 128, 0.4);
}
.sh-aggregate--degraded {
  color: #f0b849;
  border-color: rgba(240, 184, 73, 0.4);
}
.sh-aggregate--error {
  color: var(--danger, #f87171);
  border-color: rgba(248, 113, 113, 0.4);
}
.sh-aggregate--disabled,
.sh-aggregate--unknown {
  color: var(--text3);
}
.sh-refresh {
  margin-left: auto;
  background: none;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
  color: var(--text2);
  font-size: 11px;
}
.sh-refresh:disabled {
  opacity: 0.6;
  cursor: progress;
}
.sh-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sh-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface2);
}
.sh-item-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  padding: 8px 10px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
}
.sh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text3);
  flex-shrink: 0;
}
.sh-dot--ok {
  background: var(--success, #4ade80);
}
.sh-dot--degraded {
  background: #f0b849;
}
.sh-dot--error {
  background: var(--danger, #f87171);
}
.sh-dot--disabled {
  background: var(--text3);
}
.sh-name {
  font-weight: 600;
  flex: 1;
}
.sh-status {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text2);
}
.sh-latency {
  font-size: 11px;
  color: var(--text3);
  min-width: 60px;
  text-align: right;
}
.sh-details {
  padding: 0 12px 10px 28px;
  font-size: 12px;
  color: var(--text2);
}
.sh-detail {
  margin: 0 0 6px;
  white-space: pre-wrap;
  word-break: break-word;
}
.sh-meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 12px;
  row-gap: 2px;
  margin: 0;
  font-size: 11px;
}
.sh-meta dt {
  color: var(--text3);
}
.sh-meta dd {
  margin: 0;
  word-break: break-word;
}
.sh-empty,
.sh-error {
  margin: 0;
  font-size: 12px;
  color: var(--text3);
}
.sh-error {
  color: var(--danger, #f87171);
}
.sh-footer {
  font-size: 10px;
  color: var(--text3);
  text-align: right;
}
</style>
