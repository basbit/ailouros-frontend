<template>
  <section class="artefact-browser" :aria-label="t('artefactBrowser.cardAria')">
    <header class="artefact-browser__header">
      <h3 class="artefact-browser__title">
        {{ t("artefactBrowser.headline") }}
      </h3>
      <button
        type="button"
        class="artefact-browser__refresh"
        :disabled="catalogue.loading.value || !canRefresh"
        @click="onRefresh"
      >
        {{
          catalogue.loading.value
            ? t("artefactBrowser.refreshing")
            : t("artefactBrowser.refresh")
        }}
      </button>
    </header>

    <p v-if="catalogue.lastError.value" class="artefact-browser__error">
      {{ catalogue.lastError.value }}
    </p>

    <p v-if="!workspaceRoot" class="artefact-browser__hint">
      {{ t("artefactBrowser.noWorkspace") }}
    </p>

    <template v-else-if="report">
      <p class="artefact-browser__meta">
        {{
          t("artefactBrowser.summary", {
            scenario: report.scenario,
            required: report.required.length,
            complete: report.isComplete ? "✓" : "—",
          })
        }}
      </p>
      <ul v-if="report.required.length > 0" class="artefact-browser__list">
        <li
          v-for="category in report.required"
          :key="category"
          class="artefact-browser__category"
          :class="categoryClass(category)"
        >
          <div class="artefact-browser__category-head">
            <span class="artefact-browser__category-name">{{ category }}</span>
            <span
              class="artefact-browser__badge"
              :class="`artefact-browser__badge--${categoryStatus(category)}`"
            >
              {{ t(`artefactBrowser.status.${categoryStatus(category)}`) }}
            </span>
          </div>
          <ul v-if="filesFor(category).length > 0" class="artefact-browser__files">
            <li
              v-for="entry in filesFor(category)"
              :key="entry.filename"
              class="artefact-browser__file artefact-browser__file--clickable"
              @click="openEditor(entry.filename)"
            >
              <code>{{ entry.filename }}</code>
              <span class="artefact-browser__size">
                {{ t("artefactBrowser.bytes", { size: entry.contentLength }) }}
              </span>
              <button
                v-if="ui.taskId"
                type="button"
                class="artefact-browser__edit-btn"
                :title="t('artefactBrowser.edit')"
                @click.stop="openEditor(entry.filename)"
              >
                &#9998; {{ t("artefactBrowser.edit") }}
              </button>
            </li>
          </ul>
        </li>
      </ul>
      <p v-else class="artefact-browser__hint">
        {{ t("artefactBrowser.noRequired") }}
      </p>
      <div
        v-if="report.uncategorised.length > 0"
        class="artefact-browser__uncategorised"
      >
        <h4 class="artefact-browser__sub-title">
          {{ t("artefactBrowser.uncategorisedTitle") }}
        </h4>
        <ul class="artefact-browser__files">
          <li
            v-for="filename in report.uncategorised"
            :key="filename"
            class="artefact-browser__file artefact-browser__file--clickable"
            @click="openEditor(filename)"
          >
            <code>{{ filename }}</code>
            <button
              v-if="ui.taskId"
              type="button"
              class="artefact-browser__edit-btn"
              :title="t('artefactBrowser.edit')"
              @click.stop="openEditor(filename)"
            >
              &#9998; {{ t("artefactBrowser.edit") }}
            </button>
          </li>
        </ul>
      </div>
    </template>

    <ArtefactEditorModal
      :visible="isEditorOpen"
      :task-id="ui.taskId"
      :file-path="activeEditingFile ?? ''"
      @close="isEditorOpen = false"
      @saved="onFileSaved"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import type { PresentArtefact } from "@/shared/model/artefact-catalogue-types";
import { useArtefactCatalogue } from "@/features/artefact-catalogue/useArtefactCatalogue";
import { useI18n } from "@/shared/lib/i18n";
import { useUiStore } from "@/shared/store/ui";
import ArtefactEditorModal from "@/features/artifact-editor/ArtefactEditorModal.vue";

type CategoryStatus = "present" | "empty" | "missing";

const props = defineProps<{ scenario: string; workspaceRoot: string | null }>();

const { t } = useI18n();
const ui = useUiStore();
const catalogue = useArtefactCatalogue();
const report = computed(() => catalogue.report.value);

const activeEditingFile = ref<string | null>(null);
const isEditorOpen = ref(false);

function openEditor(filename: string): void {
  activeEditingFile.value = filename;
  isEditorOpen.value = true;
}

async function onFileSaved(): Promise<void> {
  await onRefresh();
}

const canRefresh = computed(
  () => Boolean(props.scenario.trim()) && Boolean(props.workspaceRoot),
);

function filesFor(category: string): PresentArtefact[] {
  const entries = report.value?.presentByCategory[category];
  return entries ? [...entries] : [];
}

function categoryStatus(category: string): CategoryStatus {
  if (!report.value) return "missing";
  if (report.value.missing.includes(category)) return "missing";
  if (report.value.empty.includes(category)) return "empty";
  return "present";
}

function categoryClass(category: string): string {
  return `artefact-browser__category--${categoryStatus(category)}`;
}

async function onRefresh(): Promise<void> {
  if (!props.workspaceRoot) return;
  await catalogue.refresh({
    scenario: props.scenario,
    workspaceRoot: props.workspaceRoot,
  });
}
</script>

<style scoped>
.artefact-browser {
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.artefact-browser__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.artefact-browser__title {
  flex: 1 1 auto;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.artefact-browser__refresh {
  appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 4px 10px;
  font-size: 12px;
  color: var(--ink);
  cursor: pointer;
}

.artefact-browser__refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.artefact-browser__error {
  margin: 0;
  font-size: 12px;
  color: var(--error);
}

.artefact-browser__hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  font-style: italic;
}

.artefact-browser__meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.artefact-browser__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.artefact-browser__category {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 8px 10px;
  background: var(--bg-elev);
}

.artefact-browser__category--missing {
  border-color: color-mix(in srgb, var(--error) 30%, var(--line));
}

.artefact-browser__category--empty {
  border-color: color-mix(in srgb, var(--warning) 30%, var(--line));
}

.artefact-browser__category-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.artefact-browser__category-name {
  flex: 1 1 auto;
  font-weight: 600;
  color: var(--ink);
}

.artefact-browser__badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 5px;
  border-radius: var(--r-sm);
}

.artefact-browser__badge--present {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
}

.artefact-browser__badge--empty {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 16%, transparent);
}

.artefact-browser__badge--missing {
  color: var(--error);
  background: color-mix(in srgb, var(--error) 16%, transparent);
}

.artefact-browser__files {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.artefact-browser__file {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 11px;
}

.artefact-browser__file code {
  flex: 1 1 auto;
  font-family: var(--font-mono);
  color: var(--ink-2);
  word-break: break-all;
}

.artefact-browser__size {
  color: var(--ink-4);
  white-space: nowrap;
}

.artefact-browser__sub-title {
  margin: 4px 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.artefact-browser__file--clickable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.artefact-browser__file--clickable:hover {
  background: var(--card-soft, rgba(80, 60, 30, 0.06));
}

.artefact-browser__edit-btn {
  font-family: var(--font-sans, sans-serif);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--r-sm, 4px);
  border: 1px solid var(--line-strong, rgba(80, 60, 30, 0.2));
  background: var(--card, #f7f1e3);
  color: var(--ink-2, #3d342a);
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s ease;
  margin-left: 4px;
}

.artefact-browser__file:hover .artefact-browser__edit-btn {
  opacity: 1;
  border-color: var(--accent, #e16a3a);
  color: var(--accent, #e16a3a);
}
</style>
