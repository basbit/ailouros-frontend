<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type {
  CreatePullRequestResponse,
  ImportIssueResponse,
} from "@/entities/issue-ingress/model/types";
import {
  createPullRequest,
  importIssue,
} from "@/entities/issue-ingress/api/issue-ingress-api";

const props = defineProps<{
  /** The project the pull request is raised against. Required by the backend:
   * defaulting it is what made the PR button branch the swarm's own repo. */
  workspaceRoot?: string | null;
}>();

const emit = defineEmits<{
  (event: "imported", data: ImportIssueResponse): void;
  (event: "prCreated", data: CreatePullRequestResponse): void;
}>();

const { t } = useI18n();

const issueUrl = ref("");
const isImporting = ref(false);
const isCreatingPr = ref(false);
const errorMessage = ref<string | null>(null);
const importedIssue = ref<ImportIssueResponse | null>(null);
const pullRequestResult = ref<CreatePullRequestResponse | null>(null);

async function handleImport(): Promise<void> {
  if (!issueUrl.value.trim()) return;

  isImporting.value = true;
  errorMessage.value = null;
  pullRequestResult.value = null;

  try {
    const result = await importIssue(issueUrl.value.trim());
    importedIssue.value = result;
    emit("imported", result);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isImporting.value = false;
  }
}

const canCreatePr = computed(
  () => Boolean(importedIssue.value) && Boolean(props.workspaceRoot?.trim()),
);

async function handleCreatePr(): Promise<void> {
  const workspaceRoot = props.workspaceRoot?.trim();
  if (!importedIssue.value || !workspaceRoot) {
    errorMessage.value = t("issueIngress.workspaceRequired");
    return;
  }

  isCreatingPr.value = true;
  errorMessage.value = null;

  try {
    const result = await createPullRequest({
      workspace_root: workspaceRoot,
      branch_name: importedIssue.value.branch_name,
      title: importedIssue.value.title,
      body: importedIssue.value.body,
    });
    pullRequestResult.value = result;
    emit("prCreated", result);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isCreatingPr.value = false;
  }
}
</script>

<template>
  <div class="issue-importer">
    <div class="issue-importer__header">
      <h3 class="issue-importer__title">
        {{ t("issueIngress.title") }}
      </h3>
    </div>

    <div class="issue-importer__form">
      <input
        v-model="issueUrl"
        type="text"
        :placeholder="t('issueIngress.placeholder')"
        class="issue-importer__input"
        @keydown.enter.prevent="handleImport"
      />
      <button
        type="button"
        :disabled="isImporting || !issueUrl.trim()"
        class="btn-primary"
        @click="handleImport"
      >
        {{ isImporting ? t("issueIngress.importing") : t("issueIngress.import") }}
      </button>
    </div>

    <div v-if="errorMessage" class="issue-importer__error">
      {{ t("issueIngress.error", { error: errorMessage }) }}
    </div>

    <div v-if="importedIssue" class="issue-importer__result">
      <div class="issue-importer__result-top">
        <span class="chip issue-importer__source">
          {{ t("issueIngress.source") }}: {{ importedIssue.source }}
        </span>
        <span class="issue-importer__meta">
          {{ t("issueIngress.author") }}: {{ importedIssue.author }}
        </span>
      </div>

      <div class="issue-importer__issue-title">
        {{ importedIssue.title }}
      </div>

      <div class="issue-importer__branch">
        <span>{{ t("issueIngress.branch") }}:</span>
        <span class="chip">
          {{ importedIssue.branch_name }}
        </span>
      </div>

      <div v-if="importedIssue.labels.length > 0" class="issue-importer__labels">
        <span class="issue-importer__labels-caption"
          >{{ t("issueIngress.labels") }}:</span
        >
        <span v-for="label in importedIssue.labels" :key="label" class="chip">
          {{ label }}
        </span>
      </div>

      <div class="issue-importer__result-footer">
        <a
          :href="importedIssue.issue_url"
          target="_blank"
          rel="noopener noreferrer"
          class="issue-importer__link"
        >
          {{ importedIssue.issue_url }}
        </a>

        <button
          type="button"
          :disabled="isCreatingPr || !canCreatePr"
          class="btn-primary btn-primary--success"
          @click="handleCreatePr"
        >
          {{ isCreatingPr ? t("issueIngress.creatingPr") : t("issueIngress.createPr") }}
        </button>
      </div>
    </div>

    <div v-if="pullRequestResult" class="issue-importer__pr">
      <div class="issue-importer__pr-headline">
        {{ t("issueIngress.prCreated", { url: pullRequestResult.pull_request_url }) }}
      </div>
      <a
        :href="pullRequestResult.pull_request_url"
        target="_blank"
        rel="noopener noreferrer"
        class="issue-importer__pr-link"
      >
        {{ pullRequestResult.pull_request_url }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.issue-importer {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-md);
  padding: 16px 18px;
}

.issue-importer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.issue-importer__title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  color: var(--ink);
}

.issue-importer__form {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.issue-importer__input {
  flex: 1 1 auto;
  min-width: 0;
}

.issue-importer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.issue-importer__error {
  margin-top: 12px;
  font-size: 12px;
  color: var(--error);
}

.issue-importer__result {
  margin-top: 14px;
  background: var(--card-soft);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 12px;
  font-size: 12px;
}

.issue-importer__result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.issue-importer__source {
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.issue-importer__meta {
  font-size: 11px;
  color: var(--ink-3);
}

.issue-importer__issue-title {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
}

.issue-importer__branch {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-3);
}

.issue-importer__labels {
  margin-top: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.issue-importer__labels-caption {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  margin-right: 2px;
}

.issue-importer__result-footer {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.issue-importer__link {
  font-size: 11px;
  color: var(--accent);
  text-decoration: none;
  overflow-wrap: anywhere;
}

.issue-importer__link:hover {
  text-decoration: underline;
}

.issue-importer__pr {
  margin-top: 12px;
  border-radius: var(--r-md);
  border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent);
  background: color-mix(in srgb, var(--ok) 12%, transparent);
  padding: 12px;
  font-size: 12px;
  color: var(--ok);
}

.issue-importer__pr-headline {
  font-weight: 500;
}

.issue-importer__pr-link {
  display: block;
  margin-top: 4px;
  color: var(--ok);
  text-decoration: underline;
  overflow-wrap: anywhere;
}
</style>
