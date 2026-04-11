<template>
  <div class="section">
    <div class="section-title">{{ t("project.title") }}</div>
    <div
      class="field"
      style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center"
    >
      <select
        :value="currentId"
        style="flex: 1; min-width: 120px"
        @change="emit('change', ($event.target as HTMLSelectElement).value)"
      >
        <option v-for="p in projectList" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>
    <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap">
      <button type="button" class="btn-secondary" @click="emit('new')">
        {{ t("project.new") }}
      </button>
      <button type="button" class="btn-ghost" @click="emit('rename')">
        {{ t("project.rename") }}
      </button>
      <button type="button" class="btn-ghost" @click="emit('delete')">
        {{ t("project.delete") }}
      </button>
    </div>
    <div class="hint" style="margin-top: 8px">
      {{ t("project.scope") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  currentId: string;
  projectList: { id: string; name: string }[];
}>();
const emit = defineEmits<{
  change: [id: string];
  new: [];
  rename: [];
  delete: [];
}>();
const { t } = useI18n();
</script>
