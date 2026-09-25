<template>
  <div class="field">
    <label class="field-label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      :type="numeric ? 'number' : 'text'"
      :min="min"
      :max="max"
      :placeholder="placeholder"
      :value="state[field]"
      :data-test="`text-${field}`"
      spellcheck="false"
      @input="setKey(field, ($event.target as HTMLInputElement).value)"
    />
    <div class="hint">
      {{ help }}
      <code>{{ envName }}</code>
      <SettingSourceNote :field="field" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SettingSourceNote from "./SettingSourceNote.vue";
import { computed } from "vue";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import type { StringSettingKey } from "@/shared/lib/global-search/types";

const props = defineProps<{
  field: StringSettingKey;
  label: string;
  help: string;
  envName: string;
  placeholder?: string;
  numeric?: boolean;
  min?: number;
  max?: number;
}>();

const { state, setKey } = useGlobalSearchKeys();
const inputId = computed(() => `settings_${props.field}`);
</script>
