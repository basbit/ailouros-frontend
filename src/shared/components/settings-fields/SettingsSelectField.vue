<template>
  <div class="field">
    <label class="field-label" :for="inputId">{{ label }}</label>
    <select
      :id="inputId"
      :value="state[field]"
      :data-test="`select-${field}`"
      @change="setKey(field, ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <div class="hint">
      {{ help }}
      <code>{{ envName }}</code>
      <SettingSourceNote :field="field" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import type { StringSettingKey } from "@/shared/lib/global-search/types";
import SettingSourceNote from "./SettingSourceNote.vue";

const props = defineProps<{
  field: StringSettingKey;
  label: string;
  help: string;
  envName: string;
  options: readonly { value: string; label: string }[];
}>();

const { state, setKey } = useGlobalSearchKeys();
const inputId = computed(() => `settings_${props.field}`);
</script>
