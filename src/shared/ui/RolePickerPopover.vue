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
        <div class="role-picker__body">
          <div v-if="filteredRoles.length" class="role-picker__list">
            <button
              v-for="role in filteredRoles"
              :key="role.id"
              type="button"
              class="role-picker__item"
              :class="{
                'is-active': role.id === props.modelValue,
                'is-hovered': role.id === highlightedRoleId,
              }"
              @click="onPick(role.id)"
              @mouseenter="onHoverRole(role.id)"
              @focus="onHoverRole(role.id)"
            >
              <div class="role-picker__row">
                <span class="role-picker__id">{{ role.id }}</span>
                <span class="role-picker__title">{{ role.title }}</span>
              </div>
              <p v-if="role.summary" class="role-picker__summary">
                {{ role.summary }}
              </p>
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
          <div v-else class="role-picker__empty">{{ t("rolePicker.empty") }}</div>

          <aside class="role-picker__preview">
            <header class="role-picker__preview-head">
              <span class="role-picker__preview-label">
                {{ t("rolePicker.previewLabel") }}
              </span>
              <div class="role-picker__preview-meta">
                <span v-if="previewRoleId" class="role-picker__preview-id">
                  {{ previewRoleId }}
                </span>
                <button
                  v-if="previewRoleId"
                  type="button"
                  class="role-picker__edit-btn"
                  :title="t('rolePicker.editInModelsTitle')"
                  @click="() => onEditInModels(previewRoleId)"
                >
                  {{ t("rolePicker.editInModels") }}
                </button>
              </div>
            </header>
            <div v-if="!previewRoleId" class="role-picker__preview-empty">
              {{ t("rolePicker.previewHint") }}
            </div>
            <div v-else-if="promptLoading" class="role-picker__preview-empty">
              {{ t("rolePicker.previewLoading") }}
            </div>
            <div v-else-if="promptError" class="role-picker__preview-error">
              {{ promptError }}
            </div>
            <pre v-else class="role-picker__preview-body">{{ promptBody }}</pre>
          </aside>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ApiError, httpGet } from "@/shared/api/http";
import { defaultPromptPathForRole } from "@/shared/lib/use-swarm-defaults";
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
const router = useRouter();
const query = ref("");
const searchRef = ref<HTMLInputElement | null>(null);
const highlightedRoleId = ref<string>("");
const promptBody = ref<string>("");
const promptLoading = ref(false);
const promptError = ref<string>("");
const promptCache = new Map<string, string>();

const previewRoleId = computed<string>(
  () => highlightedRoleId.value || props.modelValue,
);

watch(
  () => props.open,
  async (open) => {
    if (open) {
      query.value = "";
      highlightedRoleId.value = props.modelValue;
      await nextTick();
      searchRef.value?.focus();
      void loadPromptFor(previewRoleId.value);
    }
  },
);

watch(previewRoleId, (next) => {
  void loadPromptFor(next);
});

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

function onHoverRole(id: string): void {
  highlightedRoleId.value = id;
}

async function onEditInModels(roleId: string): Promise<void> {
  await router.push({
    path: "/configure/models",
    hash: `#role-anchor-${roleId}`,
  });
  emit("close");
}

async function loadPromptFor(roleId: string): Promise<void> {
  promptError.value = "";
  promptBody.value = "";
  if (!roleId) return;
  const promptPath = defaultPromptPathForRole(roleId);
  if (!promptPath) {
    promptError.value = t("rolePicker.previewMissing");
    return;
  }
  const cached = promptCache.get(promptPath);
  if (cached !== undefined) {
    promptBody.value = cached;
    return;
  }
  promptLoading.value = true;
  try {
    const data = await httpGet<{ body?: string }>(
      `/v1/prompts/get?path=${encodeURIComponent(promptPath)}`,
    );
    const body = (data?.body ?? "").trim();
    promptCache.set(promptPath, body);
    if (roleId === previewRoleId.value) {
      promptBody.value = body;
    }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      promptError.value = t("rolePicker.previewMissing");
      return;
    }
    promptError.value = err instanceof Error ? err.message : String(err);
  } finally {
    promptLoading.value = false;
  }
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
}
.role-picker__panel {
  width: min(960px, 94vw);
  max-height: 78vh;
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
.role-picker__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  min-height: 0;
  height: 100%;
}
.role-picker__list {
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--border, #2a2f3e);
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
.role-picker__item:hover,
.role-picker__item.is-hovered {
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
.role-picker__preview {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px 12px;
  gap: 6px;
}
.role-picker__preview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.role-picker__preview-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text2, #a8b0c4);
}
.role-picker__preview-id {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--text, #f5f0e7);
}
.role-picker__preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.role-picker__edit-btn {
  appearance: none;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface2, #14171f);
  color: var(--text, #f5f0e7);
  border-radius: 6px;
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.role-picker__edit-btn:hover {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 18%, transparent);
  border-color: var(--accent, #3b5bdb);
}
.role-picker__preview-empty,
.role-picker__preview-error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.role-picker__preview-error {
  color: var(--error, #c0392b);
}
.role-picker__preview-body {
  flex: 1 1 auto;
  overflow: auto;
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--surface2, #14171f);
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--text, #f5f0e7);
}
</style>
