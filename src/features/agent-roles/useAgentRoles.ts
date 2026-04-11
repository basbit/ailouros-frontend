/**
 * useAgentRoles — reactive state and logic for per-role environment/model/prompt/profile config.
 */
import { ref, reactive } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { parseSkillIds } from "@/shared/lib/skill-utils";
import { ROLES } from "@/shared/lib/pipeline-schema";
import {
  defaultEnvironmentForRole,
  defaultModelForRole,
  defaultPromptPathForRole,
  promptChoicesForRole,
} from "@/shared/lib/use-swarm-defaults";
import {
  ensureModelChoicesForEnv,
  fetchCloudModelsForProfile,
} from "@/shared/lib/use-model-list";
import type { RoleSnapshot, RemoteProfileRow } from "@/shared/store/projects";

export interface RoleState {
  environment: string;
  modelChoices: [string, string][];
  modelSel: string;
  modelCustom: string;
  promptChoices: [string, string][];
  promptSel: string;
  promptCustom: string;
  skillIds: string;
  remoteProfile: string;
  showProfileSelect: boolean;
  modelFetchError: string | null;
}

/**
 * Create per-role reactive state for all roles.
 * `profiles` is a reactive ref to the current remote profile rows list.
 */
export function useAgentRoles(
  profiles: { value: RemoteProfileRow[] },
  onChangeCb: () => void,
) {
  const { t } = useI18n();
  const roleStates = reactive<Record<string, RoleState>>(
    Object.fromEntries(
      ROLES.map((r) => [
        r,
        {
          environment: defaultEnvironmentForRole(),
          modelChoices: [] as [string, string][],
          modelSel: "",
          modelCustom: "",
          promptChoices: promptChoicesForRole(r),
          promptSel: defaultPromptPathForRole(r),
          promptCustom: "",
          skillIds: "",
          remoteProfile: "",
          showProfileSelect: false,
          modelFetchError: null,
        } satisfies RoleState,
      ]),
    ),
  );

  const isBooting = ref(true);

  function getProfileProvider(profileId: string): string {
    const row = profiles.value.find((p) => p.id === profileId);
    return row?.provider ?? "";
  }

  function _profileOptions(): { value: string; label: string }[] {
    return profiles.value
      .filter((p) => p.id.trim())
      .map((p) => ({ value: p.id, label: `${p.id} (${p.provider})` }));
  }

  function profileOptionsForRole() {
    return _profileOptions();
  }

  function effectiveModel(r: string): string {
    const rs = roleStates[r];
    if (!rs) return "";
    return rs.modelSel === "__custom__" ? rs.modelCustom : rs.modelSel;
  }

  function effectivePromptPath(r: string): string {
    const rs = roleStates[r];
    if (!rs) return "";
    return rs.promptSel === "__custom__" ? rs.promptCustom : rs.promptSel;
  }

  async function _applyModelChoices(
    r: string,
    choices: [string, string][],
    wantModel?: string,
  ): Promise<void> {
    const rs = roleStates[r];
    if (!rs) return;
    rs.modelChoices = choices;
    const want = wantModel ?? effectiveModel(r);
    const hit = choices.find((c) => c[0] === want);
    if (hit) {
      rs.modelSel = hit[0];
      rs.modelCustom = "";
    } else if (want) {
      rs.modelSel = "__custom__";
      rs.modelCustom = want;
    } else {
      rs.modelSel = choices[0]?.[0] ?? "";
      rs.modelCustom = "";
    }
  }

  async function _fetchCloudChoices(roleId: string): Promise<[string, string][]> {
    const rs = roleStates[roleId];
    const row = profiles.value.find((p) => p.id === (rs?.remoteProfile ?? ""));
    if (!row) throw new Error(t("errors.selectCloudProfile"));
    return fetchCloudModelsForProfile(row);
  }

  async function _loadModelChoices(
    roleId: string,
    env: string,
  ): Promise<[string, string][]> {
    if (env === "cloud") return _fetchCloudChoices(roleId);
    return ensureModelChoicesForEnv(env);
  }

  async function onEnvChange(roleId: string): Promise<void> {
    const rs = roleStates[roleId];
    if (!rs) return;
    const env = rs.environment;
    rs.showProfileSelect = env === "cloud";
    rs.modelFetchError = null;
    try {
      const choices = await _loadModelChoices(roleId, env);
      const defaultModel = defaultModelForRole(roleId, env);
      await _applyModelChoices(roleId, choices, effectiveModel(roleId) || defaultModel);
    } catch (e) {
      rs.modelFetchError = e instanceof Error ? e.message : String(e);
      rs.modelChoices = [];
    }
    if (!isBooting.value) onChangeCb();
  }

  async function onRemoteProfilePick(roleId: string): Promise<void> {
    const rs = roleStates[roleId];
    if (!rs) return;
    rs.modelFetchError = null;
    try {
      const choices = await _fetchCloudChoices(roleId);
      await _applyModelChoices(roleId, choices, effectiveModel(roleId));
    } catch (e) {
      rs.modelFetchError = e instanceof Error ? e.message : String(e);
      rs.modelChoices = [];
    }
    if (!isBooting.value) onChangeCb();
  }

  function refreshAllProfileSelects(): void {
    // profile options are derived reactively; no action needed
  }

  function onModelSelect(roleId: string): void {
    const rs = roleStates[roleId];
    if (!rs) return;
    if (rs.modelSel === "__custom__" && !rs.modelCustom) {
      rs.modelCustom = defaultModelForRole(roleId, rs.environment);
    }
    if (!isBooting.value) onChangeCb();
  }

  function onPromptSelect(roleId: string): void {
    const rs = roleStates[roleId];
    if (!rs) return;
    if (rs.promptSel === "__custom__" && !rs.promptCustom) {
      rs.promptCustom = defaultPromptPathForRole(roleId);
    }
    if (!isBooting.value) onChangeCb();
  }

  async function initDefaults(): Promise<void> {
    await Promise.all(
      ROLES.map(async (r) => {
        const rs = roleStates[r];
        rs.modelFetchError = null;
        try {
          const choices = await ensureModelChoicesForEnv(rs.environment);
          rs.modelChoices = choices;
          const defModel = defaultModelForRole(r, rs.environment);
          await _applyModelChoices(r, choices, defModel);
        } catch (e) {
          rs.modelFetchError = e instanceof Error ? e.message : String(e);
          rs.modelChoices = [];
        }
        rs.promptChoices = promptChoicesForRole(r);
        rs.promptSel = defaultPromptPathForRole(r);
        rs.promptCustom = "";
      }),
    );
  }

  function _normalizeRolesSnap(
    snap: Record<string, RoleSnapshot>,
  ): Record<string, RoleSnapshot> {
    const out: Record<string, RoleSnapshot> = { ...snap };
    const legacyArch = out.arch as RoleSnapshot | undefined;
    if (legacyArch && !out.architect) {
      out.architect = { ...legacyArch };
    }
    if (out.arch) delete out.arch;
    return out;
  }

  async function applyRolesSnap(snap: Record<string, RoleSnapshot>): Promise<void> {
    const norm = _normalizeRolesSnap(snap ?? {});
    await Promise.all(
      ROLES.map(async (r) => {
        const rc = norm[r];
        const rs = roleStates[r];
        if (!rs) return;
        if (rc) {
          rs.environment = rc.environment ?? defaultEnvironmentForRole();
          rs.remoteProfile = rc.remote_profile ?? "";
          rs.skillIds = rc.skill_ids ?? "";
        } else {
          rs.environment = defaultEnvironmentForRole();
          rs.remoteProfile = "";
          rs.skillIds = "";
        }
        rs.showProfileSelect = rs.environment === "cloud";
        rs.modelFetchError = null;

        try {
          const choices = await _loadModelChoices(r, rs.environment);
          rs.modelChoices = choices;
          const wantModel = rc?.model ?? defaultModelForRole(r, rs.environment);
          await _applyModelChoices(r, choices, wantModel);
        } catch (e) {
          rs.modelFetchError = e instanceof Error ? e.message : String(e);
          rs.modelChoices = [];
        }

        rs.promptChoices = promptChoicesForRole(r);
        const wantPrompt = rc?.prompt_path ?? defaultPromptPathForRole(r);
        const promptHit = rs.promptChoices.find((c) => c[0] === wantPrompt);
        if (promptHit) {
          rs.promptSel = promptHit[0];
          rs.promptCustom = "";
        } else {
          rs.promptSel = "__custom__";
          rs.promptCustom = wantPrompt;
        }
      }),
    );
  }

  function collectRolesSnap(): Record<string, RoleSnapshot> {
    const out: Record<string, RoleSnapshot> = {};
    for (const r of ROLES) {
      const rs = roleStates[r];
      if (!rs) continue;
      out[r] = {
        environment: rs.environment,
        model: effectiveModel(r),
        prompt_path: effectivePromptPath(r),
        skill_ids: rs.skillIds,
        remote_profile: rs.remoteProfile || undefined,
      };
    }
    return out;
  }

  function collectRoleApiConfig(roleId: string): {
    environment: string;
    model: string;
    prompt_path: string;
    skill_ids?: string[];
    remote_profile?: string;
  } {
    const rs = roleStates[roleId];
    if (!rs) return { environment: "ollama", model: "", prompt_path: "" };
    const sids = parseSkillIds(rs.skillIds);
    return {
      environment: rs.environment,
      model: effectiveModel(roleId),
      prompt_path: effectivePromptPath(roleId),
      ...(sids.length ? { skill_ids: sids } : {}),
      ...(rs.remoteProfile ? { remote_profile: rs.remoteProfile } : {}),
    };
  }

  async function applyAssignments(workspaceRoot: string): Promise<string> {
    // Returns error message or "" on success
    try {
      const wr = (workspaceRoot || "").trim();
      const url = `/v1/onboarding/models${wr ? `?workspace_root=${encodeURIComponent(wr)}` : ""}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const assignments: { role: string; model_id: string; provider: string }[] =
        data.assignments ?? [];
      for (const a of assignments) {
        const rs = roleStates[a.role];
        if (!rs) continue;
        // Map provider to environment
        const env =
          a.provider === "anthropic" || a.provider === "openai"
            ? "cloud"
            : a.provider === "lm_studio"
              ? "lmstudio"
              : "ollama";
        rs.environment = env;
        rs.modelSel = "__custom__";
        rs.modelCustom = a.model_id;
        rs.showProfileSelect = env === "cloud";
        rs.modelFetchError = null;
      }
      onChangeCb();
      return "";
    } catch (e: unknown) {
      return e instanceof Error ? e.message : String(e);
    }
  }

  return {
    roleStates,
    isBooting,
    profileOptionsForRole,
    effectiveModel,
    effectivePromptPath,
    onEnvChange,
    onRemoteProfilePick,
    refreshAllProfileSelects,
    onModelSelect,
    onPromptSelect,
    initDefaults,
    applyRolesSnap,
    collectRolesSnap,
    collectRoleApiConfig,
    getProfileProvider,
    applyAssignments,
  };
}

export { parseSkillIds } from "@/shared/lib/skill-utils";
