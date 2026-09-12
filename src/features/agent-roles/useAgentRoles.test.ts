import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ROLES } from "@/entities/role";
import type { RemoteProfileRow } from "@/entities/project";
import { useAgentRoles } from "./useAgentRoles";

const { fetchCloudModelsForProfileMock, ensureModelChoicesForEnvMock } = vi.hoisted(
  () => ({
    fetchCloudModelsForProfileMock: vi.fn(),
    ensureModelChoicesForEnvMock: vi.fn(),
  }),
);

vi.mock("@/shared/lib/use-model-list", () => ({
  fetchCloudModelsForProfile: fetchCloudModelsForProfileMock,
  ensureModelChoicesForEnv: ensureModelChoicesForEnvMock,
}));

describe("useAgentRoles model_mode", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
  });

  function makeRoles(): ReturnType<typeof useAgentRoles> {
    const rolesApi = useAgentRoles({ value: [] }, vi.fn());
    rolesApi.isBooting.value = false;
    return rolesApi;
  }

  it("setAllRolesModelMode('auto') puts every role's snapshot into auto mode", () => {
    const rolesApi = makeRoles();

    rolesApi.setAllRolesModelMode("auto");

    const snap = rolesApi.collectRolesSnap();
    for (const roleId of ROLES) {
      expect(snap[roleId].model_mode).toBe("auto");
    }
  });

  it("a per-role manual override flips only that role back to manual and preserves its pinned model", () => {
    const rolesApi = makeRoles();
    rolesApi.setAllRolesModelMode("auto");
    const [targetRole, otherRole] = ROLES;
    const pinnedModel = "custom/pinned-model";
    rolesApi.roleStates[targetRole].modelSel = "__custom__";
    rolesApi.roleStates[targetRole].modelCustom = pinnedModel;

    rolesApi.setRoleModelMode(targetRole, "manual");

    const snap = rolesApi.collectRolesSnap();
    expect(snap[targetRole].model_mode).toBeUndefined();
    expect(snap[targetRole].model).toBe(pinnedModel);
    expect(snap[otherRole].model_mode).toBe("auto");
  });

  it("collectRoleApiConfig includes model_mode:'auto' for an auto role (feeds agent_config[role])", () => {
    const rolesApi = makeRoles();
    const [targetRole] = ROLES;

    rolesApi.setRoleModelMode(targetRole, "auto");

    expect(rolesApi.collectRoleApiConfig(targetRole).model_mode).toBe("auto");
  });

  it("collectRoleApiConfig omits model_mode for a manual (default) role", () => {
    const rolesApi = makeRoles();
    const [targetRole] = ROLES;

    expect(rolesApi.collectRoleApiConfig(targetRole).model_mode).toBeUndefined();
  });

  it("setAllRolesModel pins the given model on every role and forces manual mode", () => {
    const rolesApi = makeRoles();
    rolesApi.setAllRolesModelMode("auto");

    rolesApi.setAllRolesModel("deepseek/deepseek-v4-pro");

    for (const roleId of ROLES) {
      expect(rolesApi.effectiveModel(roleId)).toBe("deepseek/deepseek-v4-pro");
      expect(rolesApi.collectRoleApiConfig(roleId).model_mode).toBeUndefined();
    }
  });

  it("setAllRolesModel uses an existing choice value directly when available", () => {
    const rolesApi = makeRoles();
    const [targetRole] = ROLES;
    rolesApi.roleStates[targetRole].modelChoices = [["gpt-4o", "GPT-4o"]];

    rolesApi.setAllRolesModel("gpt-4o");

    expect(rolesApi.roleStates[targetRole].modelSel).toBe("gpt-4o");
    expect(rolesApi.roleStates[targetRole].modelCustom).toBe("");
    expect(rolesApi.effectiveModel(targetRole)).toBe("gpt-4o");
  });

  it("setAllRolesModel ignores blank input", () => {
    const onChange = vi.fn();
    const rolesApi = useAgentRoles({ value: [] }, onChange);
    rolesApi.isBooting.value = false;

    rolesApi.setAllRolesModel("   ");

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("useAgentRoles bulk cloud model choices", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const cloudProfile = {
    id: "ollama",
    provider: "ollama_cloud",
    base_url: "https://ollama.com/v1",
    api_key: "secret-key",
  } as RemoteProfileRow;

  it("loadBulkModelChoices('cloud', id) fetches the catalogue from that profile's connection", async () => {
    fetchCloudModelsForProfileMock.mockResolvedValue([
      ["deepseek-v4-flash", "deepseek-v4-flash"],
      ["__custom__", "Custom…"],
    ]);
    const rolesApi = useAgentRoles({ value: [cloudProfile] }, vi.fn());
    rolesApi.isBooting.value = false;

    await rolesApi.loadBulkModelChoices("cloud", "ollama");

    expect(fetchCloudModelsForProfileMock).toHaveBeenCalledWith(cloudProfile);
    expect(rolesApi.bulkModelChoices.value).toContainEqual([
      "deepseek-v4-flash",
      "deepseek-v4-flash",
    ]);
    expect(rolesApi.bulkModelFetchError.value).toBeNull();
  });

  it("surfaces the fetch failure instead of silently offering an empty list", async () => {
    fetchCloudModelsForProfileMock.mockRejectedValue(new Error("401 unauthorized"));
    const rolesApi = useAgentRoles({ value: [cloudProfile] }, vi.fn());
    rolesApi.isBooting.value = false;

    await rolesApi.loadBulkModelChoices("cloud", "ollama");

    expect(rolesApi.bulkModelChoices.value).toEqual([]);
    expect(rolesApi.bulkModelFetchError.value).toBe("401 unauthorized");
  });

  it("a local env uses the env catalogue and needs no profile", async () => {
    ensureModelChoicesForEnvMock.mockResolvedValue([["qwen2.5:0.5b", "qwen2.5:0.5b"]]);
    const rolesApi = useAgentRoles({ value: [cloudProfile] }, vi.fn());
    rolesApi.isBooting.value = false;

    await rolesApi.loadBulkModelChoices("ollama", "");

    expect(ensureModelChoicesForEnvMock).toHaveBeenCalledWith("ollama");
    expect(rolesApi.bulkModelChoices.value).toContainEqual([
      "qwen2.5:0.5b",
      "qwen2.5:0.5b",
    ]);
  });

  it("cloud env without a chosen profile clears the list rather than reusing a stale catalogue", async () => {
    fetchCloudModelsForProfileMock.mockResolvedValue([["deepseek-v4-flash", "d"]]);
    const rolesApi = useAgentRoles({ value: [cloudProfile] }, vi.fn());
    rolesApi.isBooting.value = false;
    await rolesApi.loadBulkModelChoices("cloud", "ollama");

    await rolesApi.loadBulkModelChoices("cloud", "");

    expect(rolesApi.bulkModelChoices.value).toEqual([]);
  });
});
