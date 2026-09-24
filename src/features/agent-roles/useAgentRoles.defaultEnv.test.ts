/**
 * Fresh install: the role states exist before `/v1/defaults` has answered, so
 * every role card opened with an empty environment select and a red
 * "Unknown env:" until the operator picked one. The backend default must be
 * adopted as soon as it is known.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";

const defaults = await vi.hoisted(async () => {
  const { ref } = await import("vue");
  return {
    snapshot: ref({
      default_role_environment: "",
      model_defaults: {} as Record<string, Record<string, string>>,
      prompt_defaults: {} as Record<string, string>,
      prompt_choices: {} as Record<string, [string, string][]>,
      remote_api_base_presets: {} as Record<string, string>,
      remote_profile_provider_options: [] as [string, string][],
      default_pipeline_order: [] as string[],
      step_dependencies: {} as Record<string, string[]>,
      roles: [] as string[],
      default_remote_api_provider: "",
      default_swarm_provider: "",
    }),
  };
});

vi.mock("@/shared/lib/use-swarm-defaults", () => ({
  swarmDefaultsSnapshot: () => defaults.snapshot.value,
  useSwarmDefaults: () => ({ defaults: defaults.snapshot }),
  defaultRemoteApiProvider: () => "",
  defaultRemoteApiBaseUrl: () => "",
  remoteProfileProviderOptions: () => [],
}));

const ensureModelChoicesForEnvMock = vi.hoisted(() => vi.fn());
vi.mock("@/shared/lib/use-model-list", () => ({
  fetchCloudModelsForProfile: vi.fn(),
  ensureModelChoicesForEnv: ensureModelChoicesForEnvMock,
}));

import { ROLES } from "@/entities/role";
import { useAgentRoles } from "./useAgentRoles";

describe("useAgentRoles — default environment on a fresh install", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    defaults.snapshot.value = { ...defaults.snapshot.value, default_role_environment: "" };
    ensureModelChoicesForEnvMock.mockReset().mockResolvedValue([["qwen3:8b", "qwen3:8b"]]);
  });

  it("adopts the backend default environment once /v1/defaults answers and loads its models", async () => {
    const rolesApi = useAgentRoles({ value: [] }, vi.fn());
    for (const roleId of ROLES) {
      expect(rolesApi.roleStates[roleId].environment).toBe("");
    }

    defaults.snapshot.value = { ...defaults.snapshot.value, default_role_environment: "ollama" };
    await nextTick();
    await Promise.resolve();

    for (const roleId of ROLES) {
      expect(rolesApi.roleStates[roleId].environment).toBe("ollama");
      expect(rolesApi.roleStates[roleId].modelFetchError).toBeNull();
    }
    expect(ensureModelChoicesForEnvMock).toHaveBeenCalledWith("ollama");
  });

  it("does not override an environment the project already chose", async () => {
    const rolesApi = useAgentRoles({ value: [] }, vi.fn());
    const [first] = ROLES;
    rolesApi.roleStates[first].environment = "lmstudio";

    defaults.snapshot.value = { ...defaults.snapshot.value, default_role_environment: "ollama" };
    await nextTick();

    expect(rolesApi.roleStates[first].environment).toBe("lmstudio");
  });
});
