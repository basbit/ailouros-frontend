import { ref } from "vue";
import { describeApiError } from "@/shared/api/api-error-detail";
import {
  type AutorunEvent,
  type AutorunRule,
  type AutorunRuleInput,
  type AutorunStatus,
  createAutorunRule,
  deleteAutorunRule,
  fetchAutorunConfig,
  fetchAutorunEvents,
  updateAutorunRule,
} from "@/shared/api/endpoints/issue-autopilot";

export const AUTOPILOT_EVENT_LIMIT = 30;

export function emptyRuleDraft(): AutorunRuleInput {
  return {
    source: "github",
    repository_key: "",
    workspace_root: "",
    scenario_id: "fix_bug",
    label: "swarm",
    target_branch: "main",
    enabled: true,
    allow_command_exec: false,
  };
}

export function useIssueAutopilot() {
  const rules = ref<AutorunRule[]>([]);
  const status = ref<AutorunStatus | null>(null);
  const events = ref<AutorunEvent[]>([]);
  const draft = ref<AutorunRuleInput>(emptyRuleDraft());
  const editingRuleId = ref<string | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const removingRuleId = ref<string | null>(null);
  const error = ref<string | null>(null);

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const [config, recent] = await Promise.all([
        fetchAutorunConfig(),
        fetchAutorunEvents(AUTOPILOT_EVENT_LIMIT),
      ]);
      rules.value = config.rules;
      status.value = config.status;
      events.value = recent;
    } catch (err: unknown) {
      error.value = describeApiError(err);
    } finally {
      loading.value = false;
    }
  }

  function edit(rule: AutorunRule): void {
    const { rule_id: ruleId, ...input } = rule;
    editingRuleId.value = ruleId;
    draft.value = { ...input };
  }

  function resetDraft(): void {
    editingRuleId.value = null;
    draft.value = emptyRuleDraft();
  }

  async function save(): Promise<boolean> {
    saving.value = true;
    error.value = null;
    try {
      const payload = { ...draft.value };
      if (editingRuleId.value) {
        await updateAutorunRule(editingRuleId.value, payload);
      } else {
        await createAutorunRule(payload);
      }
      resetDraft();
      await load();
      return true;
    } catch (err: unknown) {
      error.value = describeApiError(err);
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function remove(ruleId: string): Promise<void> {
    if (removingRuleId.value !== null) return;
    removingRuleId.value = ruleId;
    error.value = null;
    try {
      await deleteAutorunRule(ruleId);
      if (editingRuleId.value === ruleId) resetDraft();
      await load();
    } catch (err: unknown) {
      error.value = describeApiError(err);
    } finally {
      removingRuleId.value = null;
    }
  }

  return {
    rules,
    status,
    events,
    draft,
    editingRuleId,
    loading,
    saving,
    removingRuleId,
    error,
    load,
    edit,
    resetDraft,
    save,
    remove,
  };
}
