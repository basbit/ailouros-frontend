<template>
  <div class="field">
    <label class="checkbox-row">
      <input
        :id="inputId"
        type="checkbox"
        :checked="Boolean(state[field])"
        :data-test="`toggle-${field}`"
        @change="setKey(field, ($event.target as HTMLInputElement).checked)"
      />
      <span class="check-label">{{ label }}</span>
    </label>
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
import type { BooleanSettingKey } from "@/shared/lib/global-search/types";

const props = defineProps<{
  field: BooleanSettingKey;
  label: string;
  help: string;
  envName: string;
}>();

const { state, setKey } = useGlobalSearchKeys();
const inputId = computed(() => `settings_${props.field}`);
</script>
