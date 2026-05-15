<template>
  <section class="spec-drift">
    <header class="spec-drift__head">
      <h3 class="spec-drift__title">Spec Drift</h3>
      <div class="spec-drift__head-right">
        <span v-if="totalEntries" class="spec-drift__count"
          >{{ totalEntries }} items</span
        >
        <button
          type="button"
          class="spec-drift__refresh"
          :disabled="loading"
          @click="reload"
        >
          ↻
        </button>
      </div>
    </header>

    <div v-if="loading" class="spec-drift__hint">Loading drift report…</div>
    <div v-else-if="notImplemented" class="spec-drift__hint">
      Drift endpoint not available yet.
    </div>
    <div v-else-if="error" class="spec-drift__error">{{ error }}</div>
    <div v-else-if="!report || !totalEntries" class="spec-drift__hint">
      No drift detected.
    </div>
    <div v-else class="spec-drift__sections">
      <section v-if="report.stale_specs.length" class="spec-drift__section">
        <h4 class="spec-drift__section-title">Stale specs</h4>
        <ul class="spec-drift__list">
          <li
            v-for="(entry, idx) in report.stale_specs"
            :key="`spec-${idx}`"
            class="spec-drift__row"
          >
            <div class="spec-drift__row-main">
              <code v-if="entry.spec_id" class="spec-drift__code">{{
                entry.spec_id
              }}</code>
              <a
                v-if="entry.path"
                class="spec-drift__path"
                :href="fileHref(entry.path)"
                @click="onOpenFile($event, entry.path)"
              >
                {{ entry.path }}
              </a>
              <span v-if="entry.reason" class="spec-drift__reason">{{
                entry.reason
              }}</span>
            </div>
            <button
              v-if="entry.spec_id"
              type="button"
              class="spec-drift__regenerate"
              :disabled="isRegenerating(entry.spec_id)"
              @click="triggerRegenerate(entry.spec_id)"
            >
              {{ isRegenerating(entry.spec_id) ? "regenerating…" : "regenerate" }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="report.stale_code.length" class="spec-drift__section">
        <h4 class="spec-drift__section-title">Stale code</h4>
        <ul class="spec-drift__list">
          <li
            v-for="(entry, idx) in report.stale_code"
            :key="`code-${idx}`"
            class="spec-drift__row"
          >
            <div class="spec-drift__row-main">
              <code v-if="entry.spec_id" class="spec-drift__code">{{
                entry.spec_id
              }}</code>
              <a
                v-if="entry.path"
                class="spec-drift__path"
                :href="fileHref(entry.path)"
                @click="onOpenFile($event, entry.path)"
              >
                {{ entry.path }}
              </a>
              <span v-if="entry.reason" class="spec-drift__reason">{{
                entry.reason
              }}</span>
            </div>
            <button
              v-if="entry.spec_id"
              type="button"
              class="spec-drift__regenerate"
              :disabled="isRegenerating(entry.spec_id)"
              @click="triggerRegenerate(entry.spec_id)"
            >
              {{ isRegenerating(entry.spec_id) ? "regenerating…" : "regenerate" }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="report.aged_keep_regions.length" class="spec-drift__section">
        <h4 class="spec-drift__section-title">Aged keep regions</h4>
        <ul class="spec-drift__list">
          <li
            v-for="(entry, idx) in report.aged_keep_regions"
            :key="`keep-${idx}`"
            class="spec-drift__row"
          >
            <div class="spec-drift__row-main">
              <a
                v-if="entry.path"
                class="spec-drift__path"
                :href="fileHref(entry.path, entry.line)"
                @click="onOpenFile($event, entry.path, entry.line)"
              >
                {{ entry.path }}<span v-if="entry.line">:{{ entry.line }}</span>
              </a>
              <span v-if="entry.age_days !== undefined" class="spec-drift__reason">
                age {{ entry.age_days }}d
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <div v-if="regenerateError" class="spec-drift__error">{{ regenerateError }}</div>
    <div v-else-if="lastOutcome" class="spec-drift__outcome">
      Regenerated <code>{{ lastOutcome.spec_id }}</code> ·
      {{ lastOutcome.written_files.length }} files written
      <span v-if="lastOutcome.retry_count > 0"
        >· {{ lastOutcome.retry_count }} retries</span
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useSpecDrift } from "./useSpecDrift";

const props = withDefaults(
  defineProps<{ workspaceRoot?: string; autoLoad?: boolean }>(),
  { workspaceRoot: "", autoLoad: true },
);

const emit = defineEmits<{
  openFile: [path: string, line?: number];
  regenerated: [specId: string];
}>();

const {
  report,
  loading,
  error,
  notImplemented,
  regenerating,
  regenerateError,
  lastOutcome,
  load,
  regenerate,
} = useSpecDrift();

const totalEntries = computed(() => {
  if (!report.value) return 0;
  return (
    report.value.stale_code.length +
    report.value.stale_specs.length +
    report.value.aged_keep_regions.length
  );
});

function isRegenerating(specId: string | undefined): boolean {
  if (!specId) return false;
  return Boolean(regenerating.value[specId]);
}

async function reload(): Promise<void> {
  await load(props.workspaceRoot);
}

function fileHref(path: string, line?: number): string {
  return line ? `file://${path}#L${line}` : `file://${path}`;
}

function onOpenFile(event: MouseEvent, path: string, line?: number): void {
  event.preventDefault();
  emit("openFile", path, line);
}

async function triggerRegenerate(specId: string | undefined): Promise<void> {
  if (!specId) return;
  const outcome = await regenerate(specId);
  if (outcome) {
    emit("regenerated", outcome.spec_id);
    await reload();
  }
}

onMounted(() => {
  if (props.autoLoad) void reload();
});

watch(
  () => props.workspaceRoot,
  () => {
    if (props.autoLoad) void reload();
  },
);
</script>

<style scoped>
.spec-drift {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--border, #e2e2e6);
  border-radius: 8px;
  padding: 12px;
}
.spec-drift__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.spec-drift__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.spec-drift__head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spec-drift__count {
  font-size: 11px;
  color: var(--text2, #888);
}
.spec-drift__refresh {
  background: transparent;
  border: 1px solid var(--border, #d4d4d8);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}
.spec-drift__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.spec-drift__hint {
  font-size: 13px;
  color: var(--text2, #888);
}
.spec-drift__error {
  font-size: 13px;
  color: var(--error, #c0392b);
}
.spec-drift__sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.spec-drift__section-title {
  margin: 0 0 4px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #888);
}
.spec-drift__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.spec-drift__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: var(--surface2, #fafafb);
  border-radius: 6px;
}
.spec-drift__row-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}
.spec-drift__code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  color: var(--text2, #555);
}
.spec-drift__path {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 12px;
  color: var(--accent, #2f6fb3);
  text-decoration: none;
  word-break: break-all;
}
.spec-drift__path:hover {
  text-decoration: underline;
}
.spec-drift__reason {
  font-size: 12px;
  color: var(--text2, #888);
  font-style: italic;
}
.spec-drift__regenerate {
  border: 1px solid var(--border, #d4d4d8);
  background: transparent;
  border-radius: 4px;
  padding: 2px 10px;
  cursor: pointer;
  font-size: 12px;
}
.spec-drift__regenerate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.spec-drift__outcome {
  font-size: 12px;
  color: var(--text2, #888);
}
</style>
