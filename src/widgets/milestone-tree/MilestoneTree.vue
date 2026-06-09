<template>
  <section class="milestone-tree" :aria-label="t('milestones.cardAria')">
    <header class="milestone-tree__header">
      <h3 class="milestone-tree__title">
        {{ t("milestones.headline") }}
      </h3>
      <button
        type="button"
        class="milestone-tree__refresh"
        :disabled="milestones.loading.value || !workspaceRoot"
        @click="onRefresh"
      >
        {{
          milestones.loading.value
            ? t("milestones.refreshing")
            : t("milestones.refresh")
        }}
      </button>
    </header>

    <p v-if="milestones.lastError.value" class="milestone-tree__error">
      {{ milestones.lastError.value }}
    </p>

    <p v-if="!workspaceRoot" class="milestone-tree__hint">
      {{ t("milestones.noWorkspace") }}
    </p>

    <ol v-else-if="milestones.milestones.value.length > 0" class="milestone-tree__list">
      <li
        v-for="milestone in milestones.milestones.value"
        :key="milestone.milestoneId"
        class="milestone-tree__milestone"
      >
        <div class="milestone-tree__row">
          <span
            class="milestone-tree__status"
            :class="`milestone-tree__status--${milestone.status}`"
            >{{ milestone.status }}</span
          >
          <span class="milestone-tree__name">{{ milestone.title }}</span>
          <code class="milestone-tree__id">{{ milestone.milestoneId }}</code>
        </div>
        <ol v-if="milestone.plans.length > 0" class="milestone-tree__children">
          <li
            v-for="plan in milestone.plans"
            :key="plan.planId"
            class="milestone-tree__plan"
          >
            <div class="milestone-tree__row">
              <span
                class="milestone-tree__status"
                :class="`milestone-tree__status--${plan.status}`"
                >{{ plan.status }}</span
              >
              <span class="milestone-tree__name">{{ plan.title }}</span>
              <code class="milestone-tree__id">{{ plan.planId }}</code>
            </div>
            <ol v-if="plan.waves.length > 0" class="milestone-tree__children">
              <li
                v-for="wave in plan.waves"
                :key="wave.waveId"
                class="milestone-tree__wave"
              >
                <div class="milestone-tree__row">
                  <span
                    class="milestone-tree__status"
                    :class="`milestone-tree__status--${wave.status}`"
                    >{{ wave.status }}</span
                  >
                  <span class="milestone-tree__name">{{ wave.title }}</span>
                </div>
                <ol v-if="wave.tasks.length > 0" class="milestone-tree__children">
                  <li
                    v-for="task in wave.tasks"
                    :key="task.taskId"
                    class="milestone-tree__task"
                  >
                    <span
                      class="milestone-tree__status"
                      :class="`milestone-tree__status--${task.status}`"
                      >{{ task.status }}</span
                    >
                    <span class="milestone-tree__name">{{ task.title }}</span>
                    <code class="milestone-tree__id">{{ task.taskId }}</code>
                  </li>
                </ol>
              </li>
            </ol>
          </li>
        </ol>
      </li>
    </ol>

    <p v-else class="milestone-tree__empty">
      {{ t("milestones.empty") }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { useMilestones } from "@/features/milestones/useMilestones";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ workspaceRoot: string | null }>();

const { t } = useI18n();
const milestones = useMilestones();

async function onRefresh(): Promise<void> {
  if (!props.workspaceRoot) return;
  await milestones.refresh(props.workspaceRoot);
}
</script>

<style scoped>
.milestone-tree {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.milestone-tree__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.milestone-tree__title {
  flex: 1 1 auto;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.milestone-tree__refresh {
  appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  color: var(--ink);
  cursor: pointer;
}

.milestone-tree__refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.milestone-tree__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.milestone-tree__hint,
.milestone-tree__empty {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  font-style: italic;
}

.milestone-tree__list,
.milestone-tree__children {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.milestone-tree__children {
  margin-left: 14px;
  border-left: 1px solid var(--line);
  padding-left: 10px;
  margin-top: 4px;
}

.milestone-tree__milestone,
.milestone-tree__plan,
.milestone-tree__wave {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.milestone-tree__task,
.milestone-tree__row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.milestone-tree__name {
  flex: 1 1 auto;
  color: var(--ink);
}

.milestone-tree__id {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-4);
  word-break: break-all;
}

.milestone-tree__status {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: var(--r-sm);
}

.milestone-tree__status--pending {
  color: var(--ink-3);
  background: color-mix(in srgb, var(--ink-3) 14%, transparent);
}

.milestone-tree__status--active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}

.milestone-tree__status--done {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 16%, transparent);
}

.milestone-tree__status--blocked {
  color: var(--error);
  background: color-mix(in srgb, var(--error) 16%, transparent);
}
</style>
