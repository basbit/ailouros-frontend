<template>
  <div class="skill-ids-picker">
    <div v-if="availableIds.length" class="skill-ids-picker__chips">
      <button
        v-for="entry in availableIds"
        :key="entry.id"
        type="button"
        class="skill-ids-picker__chip"
        :class="{ 'skill-ids-picker__chip--on': selectedSet.has(entry.id) }"
        :title="entry.title"
        @click="toggle(entry.id)"
      >
        {{ entry.id }}
      </button>
    </div>
    <input
      type="text"
      class="skill-ids-picker__input"
      :placeholder="placeholder ?? 'id1, id2'"
      autocomplete="off"
      :value="modelValue"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { parseSkillIds } from "@/shared/lib/skill-utils";
import { useWorkspaceSkills, ensureSkillsLoaded } from "@/shared/lib/use-catalog";

interface SkillEntry {
  id: string;
  title: string;
}

const props = defineProps<{
  modelValue: string;
  workspaceRoot: string;
  catalogIds?: SkillEntry[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { skills } = useWorkspaceSkills(() => props.workspaceRoot);

watch(
  () => props.workspaceRoot,
  (next) => {
    void ensureSkillsLoaded(next || "");
  },
);

const availableIds = computed<SkillEntry[]>(() => {
  const seen = new Set<string>();
  const out: SkillEntry[] = [];
  for (const s of skills.value) {
    const id = (s.id ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, title: s.title ?? id });
  }
  for (const s of props.catalogIds ?? []) {
    const id = (s.id ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, title: s.title ?? id });
  }
  return out;
});

const selectedSet = computed(() => new Set(parseSkillIds(props.modelValue)));

function toggle(id: string): void {
  const current = parseSkillIds(props.modelValue);
  const idx = current.indexOf(id);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(id);
  }
  emit("update:modelValue", current.join(", "));
}

function onInput(value: string): void {
  emit("update:modelValue", value);
}
</script>

<style scoped>
.skill-ids-picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.skill-ids-picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.skill-ids-picker__chip {
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 10px;
  border: 1px solid var(--border, #4b4138);
  background: transparent;
  color: var(--text2, #cbbfad);
  cursor: pointer;
  line-height: 1.4;
  transition:
    color 0.12s,
    background 0.12s,
    border-color 0.12s;
}
.skill-ids-picker__chip:hover {
  color: var(--text, #f5f0e7);
  border-color: color-mix(in srgb, var(--text, #f5f0e7) 55%, transparent);
}
.skill-ids-picker__chip--on {
  background: color-mix(in srgb, var(--accent, #ff9d57) 18%, transparent);
  border-color: color-mix(in srgb, var(--accent, #ff9d57) 60%, transparent);
  color: var(--text, #f5f0e7);
}
.skill-ids-picker__input {
  width: 100%;
  font-size: 12px;
}
</style>
