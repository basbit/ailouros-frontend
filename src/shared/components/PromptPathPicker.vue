<template>
  <div class="prompt-path-picker">
    <select
      class="prompt-path-picker__select"
      :value="selectValue"
      @change="onSelect(($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ placeholder ?? "— выберите промпт —" }}</option>
      <optgroup v-for="group in groupedOptions" :key="group.label" :label="group.label">
        <option v-for="opt in group.options" :key="opt.path" :value="opt.path">
          {{ opt.title }}
        </option>
      </optgroup>
      <option value="__custom__">Custom…</option>
    </select>
    <input
      v-if="isCustom"
      type="text"
      class="prompt-path-picker__input"
      placeholder="path/to/prompt.md"
      autocomplete="off"
      :value="modelValue"
      @input="onInput(($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePromptsCatalog } from "@/shared/lib/use-catalog";
import type { PromptChoice } from "@/shared/api/endpoints/catalog";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { prompts } = usePromptsCatalog();

const groupedOptions = computed<{ label: string; options: PromptChoice[] }[]>(() => {
  const groups = new Map<string, PromptChoice[]>();
  for (const p of prompts.value) {
    const category = p.path.includes("/") ? p.path.split("/")[0] : "other";
    const list = groups.get(category) ?? [];
    list.push(p);
    groups.set(category, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, options]) => ({
      label,
      options: options.slice().sort((a, b) => a.title.localeCompare(b.title)),
    }));
});

const knownPaths = computed(() => new Set(prompts.value.map((p) => p.path)));

const isCustom = computed(
  () => !!props.modelValue && !knownPaths.value.has(props.modelValue),
);

const selectValue = computed(() => {
  if (!props.modelValue) return "";
  return isCustom.value ? "__custom__" : props.modelValue;
});

function onSelect(value: string): void {
  if (value === "__custom__") {
    emit("update:modelValue", props.modelValue || "");
    return;
  }
  emit("update:modelValue", value);
}

function onInput(value: string): void {
  emit("update:modelValue", value);
}
</script>

<style scoped>
.prompt-path-picker {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;
}
.prompt-path-picker__select {
  width: 100%;
  font-size: 12px;
  min-width: 0;
}
.prompt-path-picker__input {
  width: 100%;
  font-size: 12px;
  min-width: 0;
}
</style>
