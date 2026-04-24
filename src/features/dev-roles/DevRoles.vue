<template>
  <div>
    <div v-for="(role, idx) in devRoles" :key="idx" class="dev-role-row">
      <div class="dev-role-row__grid">
        <div class="field dev-role-row__name">
          <label class="field-label">{{ t("devRoles.namePlaceholder") }}</label>
          <input
            type="text"
            class="dr-name"
            :placeholder="t('devRoles.namePlaceholder')"
            autocomplete="off"
            :value="role.name"
            @input="update(idx, 'name', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field dev-role-row__env">
          <label class="field-label">env</label>
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
        </div>
        <div class="field dev-role-row__model">
          <label class="field-label">model</label>
          <span
            v-if="uiState(idx).modelFetchError"
            class="model-fetch-error"
            :title="uiState(idx).modelFetchError!"
          >
            ⚠ {{ uiState(idx).modelFetchError }}
          </span>
          <select
            v-else-if="uiState(idx).modelChoices.length > 0"
            class="dr-model"
            :value="modelSelValue(idx)"
            @change="onModelChange(idx, ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="[val, lbl] in uiState(idx).modelChoices"
              :key="val"
              :value="val"
            >
              {{ lbl }}
            </option>
            <option value="__custom__">Custom…</option>
          </select>
          <input
            v-else
            type="text"
            class="dr-model"
            placeholder="model id"
            autocomplete="off"
            :value="role.model ?? ''"
            @input="update(idx, 'model', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
      <div v-if="modelSelValue(idx) === '__custom__'" class="field">
        <label class="field-label">custom model id</label>
        <input
          type="text"
          class="dr-model-custom"
          placeholder="model id"
          autocomplete="off"
          :value="role.model ?? ''"
          @input="update(idx, 'model', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="field">
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
      <div class="dev-role-row__remove">
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
import type { DevRoleSnap, DevRoleUiState } from "@/features/dev-roles/useDevRoles";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

const _fallbackUi: DevRoleUiState = { modelChoices: [], modelFetchError: null };

const props = defineProps<{
  devRoles: DevRoleSnap[];
  uiStates: DevRoleUiState[];
}>();
const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  update: [idx: number, field: keyof DevRoleSnap, value: string];
}>();

function uiState(idx: number): DevRoleUiState {
  return props.uiStates[idx] ?? _fallbackUi;
}

function modelSelValue(idx: number): string {
  const role = props.devRoles[idx];
  if (!role) return "";
  const choices = uiState(idx).modelChoices;
  if (!choices.length) return role.model ?? "";
  const hit = choices.find(([v]) => v === role.model);
  return hit ? hit[0] : "__custom__";
}

function onModelChange(idx: number, value: string): void {
  if (value === "__custom__") {
    // Preserve the current custom id if any; otherwise leave blank so the
    // "custom model id" input appears for editing.
    const current = props.devRoles[idx]?.model ?? "";
    emit("update", idx, "model", current);
  } else {
    emit("update", idx, "model", value);
  }
}

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

<style scoped>
.dev-role-row {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dev-role-row__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 1.4fr);
  gap: 6px;
  align-items: end;
}
@media (max-width: 900px) {
  .dev-role-row__grid {
    grid-template-columns: 1fr 1fr;
  }
  .dev-role-row__model {
    grid-column: 1 / -1;
  }
}
.dev-role-row :deep(.field-label) {
  font-size: 10px;
}
.dev-role-row :deep(input),
.dev-role-row :deep(select) {
  width: 100%;
  min-width: 0;
  font-size: 12px;
}
.dev-role-row__remove {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}
.model-fetch-error {
  font-size: 10px;
  color: var(--error, #f03e3e);
}
</style>
