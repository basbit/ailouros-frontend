<template>
  <div>
    <div
      v-for="(role, idx) in devRoles"
      :key="idx"
      class="dev-role-row"
      style="
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 8px;
        margin-top: 6px;
      "
    >
      <div class="role-row" style="margin-bottom: 2px">
        <span class="role-name" style="min-width: 0; flex: 0 0 auto">
          <input
            type="text"
            class="dr-name"
            :placeholder="t('devRoles.namePlaceholder')"
            autocomplete="off"
            style="width: 90px; font-size: 12px"
            :value="role.name"
            @input="update(idx, 'name', ($event.target as HTMLInputElement).value)"
          />
        </span>
        <select
          class="dr-env"
          :value="role.environment"
          @change="
            update(idx, 'environment', ($event.target as HTMLSelectElement).value)
          "
        >
          <option value="ollama">ollama</option>
          <option value="lmstudio">lmstudio</option>
          <option value="cloud">cloud</option>
        </select>
        <input
          type="text"
          class="dr-model"
          placeholder="model id"
          autocomplete="off"
          :value="role.model ?? ''"
          @input="update(idx, 'model', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="field" style="margin-bottom: 2px">
        <label class="field-label">{{ t("devRoles.scopeLabel") }}</label>
        <input
          type="text"
          class="dr-scope"
          :placeholder="t('devRoles.scopePlaceholder')"
          autocomplete="off"
          :value="role.scope ?? ''"
          @input="update(idx, 'scope', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 4px">
        <button type="button" class="btn-icon" title="Remove" @click="remove(idx)">
          &#10005;
        </button>
      </div>
    </div>
    <button
      type="button"
      class="btn-secondary"
      style="margin-top: 4px; margin-bottom: 12px"
      @click="add"
    >
      {{ t("devRoles.add") }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { DevRoleSnap } from "@/features/dev-roles/useDevRoles";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

defineProps<{ devRoles: DevRoleSnap[] }>();
const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  update: [idx: number, field: keyof DevRoleSnap, value: string];
}>();

function add(): void {
  emit("add");
}
function remove(idx: number): void {
  emit("remove", idx);
}
function update(idx: number, field: keyof DevRoleSnap, value: string): void {
  emit("update", idx, field, value);
}
</script>
