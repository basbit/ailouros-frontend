<template>
  <div class="autopilot">
    <section class="autopilot__block">
      <h2 class="autopilot__heading">{{ t("settings.autopilot.setupTitle") }}</h2>
      <p class="hint">{{ t("settings.autopilot.setupHint") }}</p>
      <div v-if="autopilot.status.value" class="autopilot__status">
        <div class="autopilot__status-row">
          <span>GitHub</span>
          <code>{{ webhookUrl(autopilot.status.value.github_webhook_path) }}</code>
          <span :class="badgeClass(autopilot.status.value.github_secret_configured)">
            {{
              autopilot.status.value.github_secret_configured
                ? t("settings.autopilot.secretSet")
                : t("settings.autopilot.secretMissing", { name: "SWARM_GITHUB_WEBHOOK_SECRET" })
            }}
          </span>
        </div>
        <div class="autopilot__status-row">
          <span>Linear</span>
          <code>{{ webhookUrl(autopilot.status.value.linear_webhook_path) }}</code>
          <span :class="badgeClass(autopilot.status.value.linear_secret_configured)">
            {{
              autopilot.status.value.linear_secret_configured
                ? t("settings.autopilot.secretSet")
                : t("settings.autopilot.secretMissing", { name: "SWARM_LINEAR_WEBHOOK_SECRET" })
            }}
          </span>
        </div>
        <p v-if="!autopilot.status.value.ready" class="autopilot__error">
          {{ t("settings.autopilot.notReady", { reason: autopilot.status.value.not_ready_reason }) }}
        </p>
      </div>
    </section>

    <IssueAutopilotWebhookSecrets @saved="autopilot.load()" />

    <section class="autopilot__block">
      <h2 class="autopilot__heading">{{ t("settings.autopilot.rulesTitle") }}</h2>
      <p v-if="!autopilot.rules.value.length && !autopilot.loading.value" class="hint">
        {{ t("settings.autopilot.noRules") }}
      </p>
      <ul class="autopilot__rules">
        <li v-for="rule in autopilot.rules.value" :key="rule.rule_id" class="autopilot__rule">
          <div>
            <strong>{{ rule.source }} · {{ rule.repository_key }}</strong>
            <span class="autopilot__muted">
              {{ t("settings.autopilot.ruleSummary", {
                label: rule.label, scenario: rule.scenario_id, branch: rule.target_branch,
              }) }}
            </span>
            <code class="autopilot__muted">{{ rule.workspace_root }}</code>
            <span v-if="!rule.enabled" :class="badgeClass(false)">{{ t("settings.autopilot.disabled") }}</span>
            <span v-if="rule.allow_command_exec" :class="badgeClass(false)">
              {{ t("settings.autopilot.commandExecAllowed") }}
            </span>
          </div>
          <div class="autopilot__actions">
            <button type="button" @click="autopilot.edit(rule)">{{ t("settings.autopilot.edit") }}</button>
            <button
              type="button"
              :disabled="autopilot.removingRuleId.value !== null"
              @click="confirmRemove(rule)"
            >
              {{ t("settings.autopilot.delete") }}
            </button>
          </div>
        </li>
      </ul>

      <form class="autopilot__form" @submit.prevent="autopilot.save()">
        <label>
          {{ t("settings.autopilot.source") }}
          <select v-model="autopilot.draft.value.source">
            <option value="github">GitHub</option>
            <option value="linear">Linear</option>
          </select>
        </label>
        <label>
          {{
            autopilot.draft.value.source === "github"
              ? t("settings.autopilot.repository")
              : t("settings.autopilot.teamKey")
          }}
          <input
            v-model="autopilot.draft.value.repository_key"
            :placeholder="autopilot.draft.value.source === 'github' ? 'owner/repo' : 'ENG'"
            required
          />
        </label>
        <label>
          {{ t("settings.autopilot.workspaceRoot") }}
          <input v-model="autopilot.draft.value.workspace_root" required />
        </label>
        <label>
          {{ t("settings.autopilot.scenario") }}
          <input v-model="autopilot.draft.value.scenario_id" required />
        </label>
        <label>
          {{ t("settings.autopilot.label") }}
          <input v-model="autopilot.draft.value.label" required />
        </label>
        <label>
          {{ t("settings.autopilot.targetBranch") }}
          <input v-model="autopilot.draft.value.target_branch" required />
        </label>
        <label class="autopilot__checkbox">
          <input v-model="autopilot.draft.value.enabled" type="checkbox" />
          {{ t("settings.autopilot.enabled") }}
        </label>
        <label class="autopilot__checkbox">
          <input v-model="autopilot.draft.value.allow_command_exec" type="checkbox" data-test="allow-command-exec" />
          {{ t("settings.autopilot.allowCommandExec") }}
        </label>
        <p
          v-if="autopilot.draft.value.allow_command_exec"
          class="autopilot__error autopilot__form-note"
          role="alert"
          data-test="allow-command-exec-warning"
        >
          {{ t("settings.autopilot.allowCommandExecWarning") }}
        </p>
        <div class="autopilot__actions">
          <button type="submit" :disabled="autopilot.saving.value">
            {{ autopilot.editingRuleId.value ? t("settings.autopilot.update") : t("settings.autopilot.add") }}
          </button>
          <button v-if="autopilot.editingRuleId.value" type="button" @click="autopilot.resetDraft()">
            {{ t("settings.autopilot.cancel") }}
          </button>
        </div>
      </form>
      <p v-if="autopilot.error.value" class="autopilot__error" role="alert">{{ autopilot.error.value }}</p>
    </section>

    <section class="autopilot__block">
      <div class="autopilot__heading-row">
        <h2 class="autopilot__heading">{{ t("settings.autopilot.eventsTitle") }}</h2>
        <button type="button" :disabled="autopilot.loading.value" @click="autopilot.load()">
          {{ t("settings.autopilot.refresh") }}
        </button>
      </div>
      <p v-if="!autopilot.events.value.length" class="hint">{{ t("settings.autopilot.noEvents") }}</p>
      <table v-else class="autopilot__events">
        <thead>
          <tr>
            <th>{{ t("settings.autopilot.colTime") }}</th>
            <th>{{ t("settings.autopilot.colIssue") }}</th>
            <th>{{ t("settings.autopilot.colStatus") }}</th>
            <th>{{ t("settings.autopilot.colTask") }}</th>
            <th>{{ t("settings.autopilot.colPullRequest") }}</th>
            <th>{{ t("settings.autopilot.colMessage") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(event, index) in autopilot.events.value" :key="`${event.delivery_id}-${index}`">
            <td>{{ event.recorded_at }}</td>
            <td>
              <a v-if="isHttpUrl(event.issue_url)" :href="event.issue_url" target="_blank" rel="noopener noreferrer">
                {{ event.issue_url }}
              </a>
              <span v-else>{{ event.issue_url }}</span>
            </td>
            <td><span :class="kindClass(event.kind)">{{ event.kind }}</span></td>
            <td>
              <RouterLink v-if="event.task_id" :to="`/history/${event.task_id}`">
                {{ event.task_id.slice(0, 8) }}
              </RouterLink>
            </td>
            <td>
              <a
                v-if="isHttpUrl(event.pull_request_url)"
                :href="event.pull_request_url"
                target="_blank"
                rel="noopener noreferrer"
              >{{ event.pull_request_url }}</a>
            </td>
            <td>{{ event.message }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { RouterLink } from "vue-router";
import { apiUrl } from "@/shared/api/base";
import type { AutorunRule } from "@/shared/api/endpoints/issue-autopilot";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";
import { useIssueAutopilot } from "./useIssueAutopilot";
import IssueAutopilotWebhookSecrets from "./IssueAutopilotWebhookSecrets.vue";

const { t } = useI18n();
const ux = useUxStore();
const autopilot = useIssueAutopilot();

async function confirmRemove(rule: AutorunRule): Promise<void> {
  if (autopilot.removingRuleId.value !== null) return;
  const confirmed = await ux.confirmDialog({
    title: t("settings.autopilot.confirmDeleteTitle"),
    message: t("settings.autopilot.confirmDelete", { rule: `${rule.source} · ${rule.repository_key}` }),
  });
  if (!confirmed) return;
  await autopilot.remove(rule.rule_id);
}

const FAILURE_KINDS = new Set(["failed", "comment_failed", "notify_failed"]);

function webhookUrl(path: string): string {
  return new URL(apiUrl(path), window.location.href).toString();
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function badgeClass(ok: boolean): string {
  return ok ? "autopilot__badge" : "autopilot__badge autopilot__badge--warn";
}

function kindClass(kind: string): string {
  if (FAILURE_KINDS.has(kind)) return "autopilot__badge autopilot__badge--warn";
  if (kind === "pull_request_opened") return "autopilot__badge autopilot__badge--ok";
  return "autopilot__badge";
}

onMounted(() => {
  void autopilot.load();
});
</script>

<style scoped>
.autopilot {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.autopilot__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.autopilot__heading {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.autopilot__heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.autopilot__status-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.autopilot__rules {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.autopilot__rule {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid var(--line);
  padding-top: 6px;
}

.autopilot__rule > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.autopilot__form {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.autopilot__form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.autopilot__form label.autopilot__checkbox {
  flex-direction: row;
  align-items: center;
}

.autopilot__form-note {
  grid-column: 1 / -1;
}

.autopilot__actions {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}

.autopilot__muted {
  color: var(--muted);
  font-size: 12px;
}

.autopilot__badge {
  font-size: 11px;
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0 6px;
}

.autopilot__badge--warn {
  color: var(--danger, #c0392b);
}

.autopilot__badge--ok {
  color: var(--ok, #2e7d32);
}

.autopilot__error {
  color: var(--danger, #c0392b);
  margin: 0;
}

.autopilot__events {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.autopilot__events th,
.autopilot__events td {
  text-align: left;
  padding: 4px 6px;
  border-top: 1px solid var(--line);
  vertical-align: top;
  word-break: break-word;
}
</style>
