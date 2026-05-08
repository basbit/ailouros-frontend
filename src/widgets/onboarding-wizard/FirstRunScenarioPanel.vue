<template>
  <section v-if="visible" class="first-run">
    <header class="first-run__head">
      <span class="first-run__title">{{ t("firstRun.title") }}</span>
      <button type="button" class="first-run__skip" @click="emit('skip')">
        {{ t("firstRun.skip") }}
      </button>
    </header>
    <p class="first-run__sub">{{ t("firstRun.choose") }}</p>
    <div class="first-run__grid">
      <button
        v-for="entry in firstRunChoices"
        :key="entry.id"
        type="button"
        class="first-run__card"
        @click="emit('pick', entry.id)"
      >
        <span class="first-run__card-title">{{ entry.title }}</span>
        <span class="first-run__card-desc">{{ entry.description }}</span>
      </button>
    </div>
    <CapabilityList />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import {
  shortScenarioDescription,
  scenarioTitle,
  useScenarioCatalog,
} from "@/features/scenario-picker";
import CapabilityList from "@/widgets/onboarding-wizard/CapabilityList.vue";

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  pick: [scenarioId: string];
  skip: [];
}>();

const { t } = useI18n();
const catalog = useScenarioCatalog();

const FIRST_RUN_PRIORITY: string[] = [
  "build_feature",
  "code_review",
  "research_brief",
  "website_visual_qa",
  "data_analysis",
];

const firstRunChoices = computed(() => {
  if (!props.visible) return [];
  const all = catalog.scenarios.value;
  if (!all.length) return [];
  const byId = new Map(all.map((scenario) => [scenario.id, scenario]));
  const seen = new Set<string>();
  const picks: { id: string; title: string; description: string }[] = [];
  for (const id of FIRST_RUN_PRIORITY) {
    const found = byId.get(id);
    if (found && !seen.has(found.id)) {
      picks.push({
        id: found.id,
        title: scenarioTitle(found, t),
        description: shortScenarioDescription(found, t, 140),
      });
      seen.add(found.id);
    }
    if (picks.length >= 5) break;
  }
  return picks;
});

onMounted(() => {
  if (!catalog.scenarios.value.length) {
    void catalog.reload();
  }
});
</script>

<style scoped>
.first-run {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  padding: 14px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 60%, transparent);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.first-run__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.first-run__title {
  font-size: 14px;
  font-weight: 700;
}
.first-run__skip {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  cursor: pointer;
}
.first-run__sub {
  margin: 0;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.first-run__grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
.first-run__card {
  text-align: left;
  background: var(--surface2, #14171f);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 8px;
  padding: 10px;
  color: var(--text, #f5f0e7);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.first-run__card:hover {
  border-color: var(--accent, #3b5bdb);
}
.first-run__card-title {
  font-weight: 700;
  font-size: 13px;
}
.first-run__card-desc {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
</style>
