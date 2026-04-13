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
        <!-- Model select dropdown (like other agent roles) -->
        <span
          v-if="uiState(idx).modelFetchError"
          class="model-fetch-error"
          :title="uiState(idx).modelFetchError!"
          style="font-size: 10px; color: var(--error, #f03e3e)"
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
      <!-- Custom model input (when "Custom…" is selected) -->
      <div v-if="modelSelValue(idx) === '__custom__'" style="margin-bottom: 2px">
        <input
          type="text"
          class="dr-model-custom"
          placeholder="model id"
          autocomplete="off"
          style="width: 100%; font-size: 12px"
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
    emit("update", idx, "model", "");
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
