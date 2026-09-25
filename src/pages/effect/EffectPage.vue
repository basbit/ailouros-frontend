<template>
  <div class="effect-page">
    <AppHeaderContainer />
    <main class="effect-page__body">
      <header class="effect-page__head">
        <div>
          <h1 class="effect-page__title">{{ t("effect.title") }}</h1>
          <p class="effect-page__muted">{{ t("effect.subtitle") }}</p>
        </div>
        <form class="effect-page__period" @submit.prevent="load">
          <div
            class="effect-page__presets"
            role="group"
            :aria-label="t('effect.period.label')"
          >
            <button
              v-for="preset in PRESETS"
              :key="preset"
              type="button"
              :class="[
                'effect-page__preset',
                { 'effect-page__preset--active': selected === preset },
              ]"
              :data-testid="`preset-${preset}`"
              @click="choose(preset)"
            >
              {{ t(`effect.period.${preset}`) }}
            </button>
          </div>
          <label class="effect-page__field">
            {{ t("effect.period.from") }}
            <input
              v-model="range.from"
              type="date"
              name="from"
              required
              @change="selected = 'custom'"
            />
          </label>
          <label class="effect-page__field">
            {{ t("effect.period.to") }}
            <input
              v-model="range.to"
              type="date"
              name="to"
              required
              @change="selected = 'custom'"
            />
          </label>
          <label
            v-if="projectRoot"
            class="effect-page__field effect-page__field--inline"
          >
            <input
              v-model="projectOnly"
              type="checkbox"
              name="projectOnly"
              @change="load"
            />
            {{ t("effect.period.projectOnly", { path: projectRoot }) }}
          </label>
          <button type="submit" class="effect-page__apply" :disabled="loading">
            {{ t("effect.period.apply") }}
          </button>
        </form>
      </header>

      <p v-if="error" class="effect-page__error" role="alert">
        {{ t("effect.loadFailed", { error }) }}
      </p>
      <p v-else-if="loading && !report" class="effect-page__muted">
        {{ t("effect.loading") }}
      </p>

      <template v-if="report">
        <EffectTiles :report="report" />
        <p class="effect-page__muted" data-testid="triggers">
          {{ t("effect.triggers", { list: triggerList }) }}
        </p>
        <p
          v-if="report.unreadable_runs"
          class="effect-page__muted"
          data-testid="unreadable"
        >
          {{ t("effect.unreadableRuns", { count: report.unreadable_runs }) }}
        </p>
        <RunsPerDayChart :days="report.runs.per_day" />
        <EffectWinsTables :report="report" />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, reactive, ref } from "vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import { useI18n } from "@/shared/lib/i18n";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import {
  getEffectMetrics,
  type EffectReport,
} from "@/shared/api/endpoints/effect-metrics";
import {
  EffectTiles,
  EffectWinsTables,
  RunsPerDayChart,
  lastDays,
  type PeriodPreset,
} from "@/features/effect-metrics";

const PRESETS: PeriodPreset[] = ["7", "30", "custom"];

const { t } = useI18n();
const settings = useInjectedAppSettings();

const selected = ref<PeriodPreset>("7");
const range = reactive(lastDays(7, new Date()));
const projectOnly = ref(false);
const report = ref<EffectReport | null>(null);
const error = ref("");
const loading = ref(false);

const projectRoot = computed(() => (settings.form.workspace_root ?? "").trim());
const triggerList = computed(
  () =>
    Object.entries(report.value?.runs.trigger_counts ?? {})
      .map(([source, count]) => `${t(`effect.trigger.${source}`)}: ${count}`)
      .join(", ") || t("effect.noRuns"),
);

let latestRequest = 0;

async function load(): Promise<void> {
  const request = ++latestRequest;
  loading.value = true;
  try {
    const loaded = await getEffectMetrics({
      from: range.from,
      to: range.to,
      workspaceRoot: projectOnly.value ? projectRoot.value : "",
    });
    if (request !== latestRequest) return;
    report.value = loaded;
    error.value = "";
  } catch (caught: unknown) {
    if (request !== latestRequest) return;
    error.value = caught instanceof Error ? caught.message : String(caught);
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

function choose(preset: PeriodPreset): void {
  selected.value = preset;
  if (preset === "custom") return;
  Object.assign(range, lastDays(Number(preset), new Date()));
  void load();
}

// Inside <keep-alive> the first activation fires right after this mount load.
let activationFollowsMountLoad = true;
void load();
onActivated(() => {
  if (activationFollowsMountLoad) {
    activationFollowsMountLoad = false;
    return;
  }
  void load();
});
</script>

<style scoped>
.effect-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.effect-page__body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 32px 32px;
  max-width: 1100px;
}

.effect-page__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}

.effect-page__title {
  margin: 0;
  font-size: 18px;
}

.effect-page__muted {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.effect-page__error {
  margin: 0;
  color: var(--danger);
  font-size: 12px;
}

.effect-page__period {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px;
}

.effect-page__presets {
  display: flex;
  gap: 4px;
}

.effect-page__preset,
.effect-page__apply {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
}

.effect-page__preset--active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.effect-page__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: var(--muted);
}

.effect-page__field--inline {
  flex-direction: row;
  align-items: center;
  gap: 4px;
}
</style>
