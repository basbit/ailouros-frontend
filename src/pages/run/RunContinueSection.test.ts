import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { reactive } from "vue";

import RunContinueSection from "./RunContinueSection.vue";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";
import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/shared/store/projects";

const pushSpy = vi.fn();
const replaceSpy = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: pushSpy, replace: replaceSpy }),
}));

vi.mock("@/shared/api/endpoints/task-gates", () => ({
  postContinuePropose: vi.fn().mockResolvedValue({
    proposed_steps: ["dev", "qa"],
    rationale: "",
  }),
  postContinueStream: vi.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => "task-continue-123" },
    body: new ReadableStream(),
  }),
}));

vi.mock("@/shared/lib/task-gate-actions", () => ({
  drainStream: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/shared/lib/agent-config", () => ({
  buildAgentConfig: () => ({}),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function makeSettingsStub() {
  return {
    form: reactive({
      workspace_root: "/tmp/work",
      project_context_file: "",
      workspace_write: true,
      prompt: "",
      scenario_id: null,
    }),
    saveSettingsSoon: () => {},
  };
}

describe("RunContinueSection", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    pushSpy.mockClear();
    replaceSpy.mockClear();
  });

  it("runs continuation and navigates to the live route with the new task as active", async () => {
    const ui = useUiStore();
    const projects = useProjectsStore();
    const wrapper = mount(RunContinueSection, {
      props: { runId: "task-parent" },
      global: {
        provide: {
          [APP_SETTINGS_KEY as symbol]: makeSettingsStub(),
        },
      },
    });

    const textarea = wrapper.find("textarea");
    await textarea.setValue("continue this work");
    const proposeBtn = wrapper.find(".run-continue__btn");
    await proposeBtn.trigger("click");
    await flushPromises();

    // Steps proposal is shown; tick dev+qa and run.
    const stepInputs = wrapper.findAll("input[type='checkbox']");
    for (const input of stepInputs) {
      await input.setValue();
    }
    const runBtn = wrapper.find(".run-continue__btn--primary");
    await runBtn.trigger("click");
    await flushPromises();

    expect(ui.taskId).toBe("task-continue-123");
    expect(replaceSpy).toHaveBeenCalledWith("/run/active?task_id=task-continue-123");
    expect(projects.currentId).toBe("default");
  });
});
