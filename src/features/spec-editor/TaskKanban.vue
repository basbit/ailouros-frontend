<template>
  <section class="kanban">
    <header class="kanban__head">
      <h3 class="kanban__title">Tasks</h3>
      <span class="kanban__count">{{ tasks.length }}</span>
    </header>
    <div v-if="!tasks.length" class="kanban__empty">No tasks yet.</div>
    <div v-else class="kanban__cols">
      <div v-for="col in columns" :key="col.status" class="kanban__col">
        <header class="kanban__col-head">
          <span :class="['kanban__pill', `kanban__pill--${col.status}`]">
            {{ col.label }}
          </span>
          <span class="kanban__col-count">{{ col.items.length }}</span>
        </header>
        <ul class="kanban__list">
          <li v-for="task in col.items" :key="task.id" class="kanban__card">
            <div class="kanban__card-head">
              <code class="kanban__id">{{ task.id }}</code>
              <span v-if="task.estimate" class="kanban__estimate">{{
                task.estimate
              }}</span>
            </div>
            <div class="kanban__card-title">{{ task.title }}</div>
            <p v-if="task.description" class="kanban__card-desc">
              {{ task.description }}
            </p>
            <div v-if="task.depends_on.length" class="kanban__meta">
              <span class="kanban__meta-label">depends on:</span>
              <code v-for="dep in task.depends_on" :key="dep" class="kanban__chip">
                {{ dep }}
              </code>
            </div>
            <div v-if="task.requirement_refs.length" class="kanban__meta">
              <span class="kanban__meta-label">requirements:</span>
              <code
                v-for="reqId in task.requirement_refs"
                :key="reqId"
                class="kanban__chip kanban__chip--req"
              >
                {{ reqId }}
              </code>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { SpecTask, TaskStatus } from "./spec-types";

const props = defineProps<{
  tasks: SpecTask[];
}>();

interface Column {
  status: TaskStatus;
  label: string;
  items: SpecTask[];
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

const columns = computed<Column[]>(() => {
  const buckets: Record<TaskStatus, SpecTask[]> = {
    open: [],
    in_progress: [],
    done: [],
  };
  for (const task of props.tasks) {
    if (task.status in buckets) {
      buckets[task.status].push(task);
    } else {
      buckets.open.push(task);
    }
  }
  return COLUMNS.map(({ status, label }) => ({
    status,
    label,
    items: buckets[status],
  }));
});
</script>

<style scoped>
.kanban {
  border: 1px solid #e2e2e6;
  border-radius: 8px;
  padding: 12px;
}
.kanban__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.kanban__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.kanban__count,
.kanban__col-count {
  font-size: 12px;
  color: #888;
}
.kanban__empty {
  color: #888;
  font-size: 13px;
}
.kanban__cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.kanban__col {
  background: #fafafb;
  border-radius: 6px;
  padding: 8px;
  min-height: 120px;
}
.kanban__col-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.kanban__pill {
  text-transform: uppercase;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  letter-spacing: 0.04em;
  background: #f0f0f3;
}
.kanban__pill--open {
  background: #e2e9f3;
  color: #2f4a73;
}
.kanban__pill--in_progress {
  background: #fff3cd;
  color: #856404;
}
.kanban__pill--done {
  background: #d8ebd9;
  color: #1f6f2b;
}
.kanban__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kanban__card {
  background: white;
  border-radius: 6px;
  border: 1px solid #ececec;
  padding: 6px 8px;
  font-size: 12px;
}
.kanban__card-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 2px;
}
.kanban__id {
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #555;
}
.kanban__estimate {
  font-size: 11px;
  color: #888;
}
.kanban__card-title {
  font-weight: 600;
  margin-bottom: 2px;
}
.kanban__card-desc {
  margin: 2px 0;
  color: #444;
}
.kanban__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  align-items: center;
}
.kanban__meta-label {
  font-size: 11px;
  color: #888;
}
.kanban__chip {
  font-family: ui-monospace, SFMono-Regular, monospace;
  background: #f0f0f3;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
}
.kanban__chip--req {
  background: #e2e9f3;
}
</style>
