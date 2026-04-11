<template>
  <div>
    <div v-for="(skill, idx) in skills" :key="idx" class="skill-catalog-row">
      <div class="custom-role-grid">
        <div class="field">
          <label class="field-label">{{ t("skillsCatalog.idLabel") }}</label>
          <input
            type="text"
            class="sk-id"
            placeholder="e.g. my_skill"
            autocomplete="off"
            :value="skill.id"
            @input="update(idx, 'id', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label class="field-label">{{ t("skillsCatalog.titleLabel") }}</label>
          <input
            type="text"
            class="sk-title"
            placeholder="label"
            autocomplete="off"
            :value="skill.title"
            @input="update(idx, 'title', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field" style="grid-column: 1/-1">
          <label class="field-label">{{ t("skillsCatalog.pathLabel") }}</label>
          <input
            type="text"
            class="sk-path"
            placeholder=".cursor/skills/foo/SKILL.md"
            autocomplete="off"
            :value="skill.path"
            @input="update(idx, 'path', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end">
        <button type="button" class="btn-icon" title="Remove" @click="remove(idx)">
          &#10005;
        </button>
      </div>
    </div>
    <button type="button" class="btn-secondary" style="margin-top: 6px" @click="add">
      {{ t("skillsCatalog.add") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SkillCatalogSnap } from "@/features/skills-catalog/useSkillsCatalog";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

defineProps<{ skills: SkillCatalogSnap[] }>();
const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  update: [idx: number, field: keyof SkillCatalogSnap, value: string];
}>();

function add(): void {
  emit("add");
}
function remove(idx: number): void {
  emit("remove", idx);
}
function update(idx: number, field: keyof SkillCatalogSnap, value: string): void {
  emit("update", idx, field, value);
}
</script>
