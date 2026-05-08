<template>
  <Teleport to="body">
    <div v-if="open" class="role-picker" @click.self="onClose">
      <div class="role-picker__panel" role="dialog">
        <header class="role-picker__head">
          <input
            ref="searchRef"
            type="text"
            class="role-picker__search"
            :value="query"
            :placeholder="t('rolePicker.searchPlaceholder')"
            @input="onQueryInput($event)"
          />
          <button type="button" class="role-picker__close" @click="onClose">×</button>
        </header>
        <div v-if="filteredRoles.length" class="role-picker__list">
          <button
            v-for="role in filteredRoles"
            :key="role.id"
            type="button"
            class="role-picker__item"
            :class="{ 'is-active': role.id === props.modelValue }"
            @click="onPick(role.id)"
          >
            <div class="role-picker__row">
              <span class="role-picker__id">{{ role.id }}</span>
              <span class="role-picker__title">{{ role.title }}</span>
            </div>
            <p v-if="role.summary" class="role-picker__summary">{{ role.summary }}</p>
            <div v-if="role.skills.length" class="role-picker__skills">
              <span
                v-for="skill in role.skills"
                :key="skill"
                class="role-picker__skill"
                >{{ skill }}</span
              >
            </div>
          </button>
        </div>
        <div v-else class="role-picker__empty">
          {{ t("rolePicker.empty") }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";

export interface RoleSummary {
  id: string;
  title: string;
  summary: string;
  skills: string[];
}

const props = defineProps<{
  open: boolean;
  modelValue: string;
  roles: RoleSummary[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  close: [];
}>();

const { t } = useI18n();
const query = ref("");
const searchRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  async (open) => {
    if (open) {
      query.value = "";
      await nextTick();
      searchRef.value?.focus();
    }
  },
);

const filteredRoles = computed<RoleSummary[]>(() => {
  const text = query.value.trim().toLowerCase();
  if (!text) return props.roles;
  return props.roles.filter((role) => {
    const haystack = [role.id, role.title, role.summary, ...role.skills]
      .join(" ")
      .toLowerCase();
    return haystack.includes(text);
  });
});

function onQueryInput(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  query.value = target?.value ?? "";
}

function onPick(id: string): void {
  emit("update:modelValue", id);
  emit("close");
}

function onClose(): void {
  emit("close");
}
</script>

<style scoped>
.role-picker {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 80px;
  z-index: 2000;
  opacity: 1;
}
.role-picker__panel {
  width: min(560px, 90vw);
  max-height: 70vh;
  background: var(--surface, #1a1d29);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.role-picker__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.role-picker__search {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface2, #14171f);
  color: var(--text, #f5f0e7);
}
.role-picker__close {
  background: transparent;
  border: none;
  color: var(--text2, #a8b0c4);
  font-size: 18px;
  cursor: pointer;
}
.role-picker__list {
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.role-picker__item {
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--text, #f5f0e7);
  cursor: pointer;
}
.role-picker__item:hover {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 12%, transparent);
}
.role-picker__item.is-active {
  border-color: var(--accent, #3b5bdb);
}
.role-picker__row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.role-picker__id {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.role-picker__title {
  font-weight: 600;
}
.role-picker__summary {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.role-picker__skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.role-picker__skill {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text3, #6b7280) 25%, transparent);
  color: var(--text2, #a8b0c4);
}
.role-picker__empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
</style>
