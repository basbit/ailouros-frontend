import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { ROLES } from "@/shared/lib/pipeline-schema";
import { useAgentRoles } from "./useAgentRoles";

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
