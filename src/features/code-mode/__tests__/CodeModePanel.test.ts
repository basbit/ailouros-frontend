import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

import CodeModePanel from "../CodeModePanel.vue";
import type {
  CodeModeRunInput,
  CodeModeRunResult,
  CodeModeStatus,
} from "@/shared/api/endpoints/code-mode";

const statusMock = vi.fn<() => Promise<CodeModeStatus>>();
const runMock = vi.fn<(input: CodeModeRunInput) => Promise<CodeModeRunResult>>();

vi.mock("@/shared/api/endpoints/code-mode", () => ({
  getCodeModeStatus: () => statusMock(),
  runCodeMode: (input: CodeModeRunInput) => runMock(input),
}));

function makeStatus(overrides: Partial<CodeModeStatus> = {}): CodeModeStatus {
  return {
    enabled: true,
    commandExecAllowed: true,
    workspaceWriteAllowed: true,
    dockerAvailable: true,
    languages: ["node", "python"],
    profiles: { python: "docker-python", node: "docker-node" },
    profileIsolating: { python: true, node: true },
    ...overrides,
  };
}

async function mountPanel(status: CodeModeStatus) {
  statusMock.mockResolvedValue(status);
  const wrapper = mount(CodeModePanel);
  await flushPromises();
  return wrapper;
}

describe("CodeModePanel", () => {
  beforeEach(() => {
    statusMock.mockReset();
    runMock.mockReset();
  });

  it("refuses to offer Run while code mode is off", async () => {
    const wrapper = await mountPanel(makeStatus({ enabled: false }));
    await wrapper.find(".code-mode__program").setValue("print(1)");

    expect(wrapper.find(".code-mode__blocked").text()).toContain(
      "SWARM_ENABLE_CODE_MODE",
    );
    expect(
      wrapper.find(".code-mode__run").attributes("disabled"),
    ).toBeDefined();
  });

  it("refuses to offer Run while the execution gate is off", async () => {
    const wrapper = await mountPanel(
      makeStatus({ commandExecAllowed: false }),
    );
    await wrapper.find(".code-mode__program").setValue("print(1)");

    expect(wrapper.find(".code-mode__blocked").text()).toContain(
      "SWARM_ALLOW_COMMAND_EXEC",
    );
    expect(
      wrapper.find(".code-mode__run").attributes("disabled"),
    ).toBeDefined();
  });

  it("says docker is missing instead of offering to run on the host", async () => {
    const wrapper = await mountPanel(makeStatus({ dockerAvailable: false }));
    await wrapper.find(".code-mode__program").setValue("print(1)");

    expect(wrapper.find(".code-mode__blocked").text()).toContain("Docker");
    expect(
      wrapper.find(".code-mode__run").attributes("disabled"),
    ).toBeDefined();
    expect(runMock).not.toHaveBeenCalled();
  });

  it("names the non-isolating profile rather than running anyway", async () => {
    const wrapper = await mountPanel(
      makeStatus({ profileIsolating: { python: false, node: true } }),
    );
    await wrapper.find(".code-mode__program").setValue("print(1)");

    expect(wrapper.find(".code-mode__blocked").text()).toContain("profiles.json");
    expect(
      wrapper.find(".code-mode__run").attributes("disabled"),
    ).toBeDefined();
  });

  it("runs when every gate is open and renders the program output", async () => {
    runMock.mockResolvedValue({
      language: "python",
      profile: "docker-python",
      verdict: "ok",
      exitCode: 0,
      stdout: "42",
      stderr: "",
      durationSeconds: 0.1,
      truncated: false,
      message: "",
      writtenPaths: ["generated/out.txt"],
      writeRefusal: "",
    });
    const wrapper = await mountPanel(makeStatus());
    await wrapper.find(".code-mode__program").setValue("print(6*7)");
    await wrapper.find(".code-mode__run").trigger("click");
    await flushPromises();

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".code-mode__stream").text()).toBe("42");
    expect(wrapper.find(".code-mode__written").text()).toContain(
      "generated/out.txt",
    );
  });

  it("shows the backend write refusal verbatim", async () => {
    runMock.mockResolvedValue({
      language: "python",
      profile: "docker-python",
      verdict: "ok",
      exitCode: 0,
      stdout: "",
      stderr: "",
      durationSeconds: 0.1,
      truncated: false,
      message: "",
      writtenPaths: [],
      writeRefusal:
        "code_mode: refused the whole write batch — sensitive paths: .env",
    });
    const wrapper = await mountPanel(makeStatus());
    await wrapper.find(".code-mode__program").setValue("print(1)");
    await wrapper.find(".code-mode__run").trigger("click");
    await flushPromises();

    expect(wrapper.find(".code-mode__refusal").text()).toContain(".env");
  });
});
