import { describe, expect, it, vi } from "vitest";
import { reactive, ref } from "vue";
import { mount } from "@vue/test-utils";
import type { AppSettings } from "@/app/providers/settingsContext";
import { APP_SETTINGS_KEY } from "@/app/providers/settingsContext";
import { buildAgentConfig } from "@/entities/agent-config";
import { baseSettingsDefaults } from "@/entities/project";

vi.mock("vue-router", () => ({
  useRoute: () => ({ hash: "" }),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/pages/swarm-ui/useRoleHandlers", () => ({
  useRoleHandlers: () => ({}),
}));

vi.mock("@/pages/swarm-ui/useSwarmUiDerived", () => ({
  useSwarmUiDerived: () => ({
    profileOptions: ref([]),
    skillsCatalogIds: ref([]),
    mediaForm: ref({}),
  }),
}));

vi.mock("@/entities/external-agent/api/external-agent-api", () => ({
  fetchExternalHarnesses: vi.fn().mockResolvedValue([
    {
      name: "Aider CLI",
      generator_type: "aider",
      is_available: true,
      binary_path: "/usr/local/bin/aider",
      description: "Aider",
    },
  ]),
}));

import ModelsPane from "../ModelsPane.vue";

function mountPane() {
  const saveSettingsSoon = vi.fn();
  const form = reactive({ dev_code_generator: "native", workspace_root: "" });
  const settings = {
    form,
    saveSettingsSoon,
    rolesState: {
      roleStates: {},
      bulkModelChoices: ref([]),
      bulkModelFetchError: ref(""),
    },
    devRolesState: { devRoles: ref([]), uiStates: [] },
    customRolesState: { customRoles: ref([]), uiStates: [] },
    crossValidationState: { validators: ref([]), uiStates: [] },
    skillsState: { skills: ref([]) },
  } as unknown as AppSettings;

  const wrapper = mount(ModelsPane, {
    global: {
      provide: { [APP_SETTINGS_KEY as symbol]: settings },
      stubs: {
        PaneHeader: true,
        AgentRoles: true,
        DevRoles: true,
        SkillsCatalog: true,
        CustomRoles: true,
        CrossValidation: true,
      },
    },
  });
  return { wrapper, form, saveSettingsSoon };
}

describe("ModelsPane external code generator", () => {
  it("persists the picked generator into the settings form", async () => {
    const { wrapper, form, saveSettingsSoon } = mountPane();
    const picker = wrapper.findComponent({ name: "ExternalAgentPicker" });

    expect(picker.props("modelValue")).toBe("native");

    picker.vm.$emit("update:modelValue", "aider");
    await wrapper.vm.$nextTick();

    expect(form.dev_code_generator).toBe("aider");
    expect(saveSettingsSoon).toHaveBeenCalled();
  });

  it("sends the persisted generator to the backend through agent_config.swarm", () => {
    const form = { ...baseSettingsDefaults(), dev_code_generator: "claude_code" };

    const config = buildAgentConfig({
      form: form as never,
      profilesState: { getDuplicateIds: () => [], collectAsObject: () => ({}) },
      rolesState: { collectRoleApiConfig: () => ({}) },
      devRolesState: { collectForApi: () => [] },
      crossValidationState: { collectForApi: () => null },
      customRolesState: { collectSnap: () => [] },
      skillsState: { collectForApi: () => ({}) },
    });

    expect((config?.swarm as Record<string, unknown>).code_generator).toBe(
      "claude_code",
    );
  });
});
