import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import FileFeedbackControls from "../FileFeedbackControls.vue";
import DiffViewer from "../DiffViewer.vue";
import { formatUserEditDiff } from "../useFileFeedback";
import * as httpModule from "@/shared/api/http";
import { useUxStore } from "@/shared/store/ux";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";

vi.mock("@/shared/api/http", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly body?: string,
    ) {
      super(message);
    }
  },
  httpGet: vi.fn(),
  httpPost: vi.fn(),
  httpPatch: vi.fn(),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${Object.values(params).join(",")}` : key,
  }),
}));

const RECEIPT = { id: "fb-1", recorded_at: "2026-09-24T00:00:00+00:00" };

function settingsWith(workspaceRoot: string, memoryNamespace = "default") {
  return {
    [APP_SETTINGS_KEY as symbol]: {
      form: { workspace_root: workspaceRoot, swarm_memory_namespace: memoryNamespace },
    },
  };
}

function mountControls(
  props: Record<string, unknown> = {},
  provide: Record<symbol, unknown> = settingsWith("/work/project-a"),
) {
  return mount(FileFeedbackControls, {
    props: { taskId: "task-1", filePath: "src/report.py", ...props },
    global: { provide },
  });
}

describe("FileFeedbackControls", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("posts an accept verdict for the task and locks the controls", async () => {
    vi.mocked(httpModule.httpPost).mockResolvedValueOnce(RECEIPT);
    const wrapper = mountControls();

    await wrapper.find('[data-verdict="accept"]').trigger("click");
    await flushPromises();

    expect(httpModule.httpPost).toHaveBeenCalledWith("/v1/codegen-feedback", {
      spec_id: "_task:task-1",
      agent: "dev",
      target_file: "src/report.py",
      verdict: "accept",
      reason: null,
      user_edit_diff: null,
      tags: [],
      workspace_root: "/work/project-a",
      memory_namespace: null,
    });
    expect(wrapper.findAll("button")).toHaveLength(0);
    expect(wrapper.text()).toContain("codegenFeedback.done.accept");
    expect(useUxStore().toasts.map((toast) => toast.tone)).toEqual(["success"]);
  });

  it("asks for a reason before sending a reject verdict", async () => {
    vi.mocked(httpModule.httpPost).mockResolvedValueOnce(RECEIPT);
    const wrapper = mountControls();

    await wrapper.find('[data-verdict="reject"]').trigger("click");
    expect(httpModule.httpPost).not.toHaveBeenCalled();
    await wrapper.find("textarea").setValue("  Uses a global connection  ");
    await wrapper.find(".file-feedback__submit").trigger("click");
    await flushPromises();

    expect(vi.mocked(httpModule.httpPost).mock.calls[0][1]).toMatchObject({
      verdict: "reject",
      reason: "Uses a global connection",
      user_edit_diff: null,
    });
    expect(wrapper.find("textarea").exists()).toBe(false);
    expect(wrapper.text()).toContain("codegenFeedback.done.reject");
  });

  it("attaches the user's saved edit to an edit verdict", async () => {
    vi.mocked(httpModule.httpPost).mockResolvedValueOnce(RECEIPT);
    const wrapper = mountControls({ userEditDiff: "-old()\n+new()" });

    await wrapper.find('[data-verdict="edit"]').trigger("click");
    expect(wrapper.text()).toContain("codegenFeedback.diffAttached");
    await wrapper.find("textarea").setValue("renamed");
    await wrapper.find(".file-feedback__submit").trigger("click");
    await flushPromises();

    expect(vi.mocked(httpModule.httpPost).mock.calls[0][1]).toMatchObject({
      verdict: "edit",
      reason: "renamed",
      user_edit_diff: "-old()\n+new()",
    });
  });

  it("sends the project's configured memory namespace so the dev prompt of that project finds it", async () => {
    vi.mocked(httpModule.httpPost).mockResolvedValueOnce(RECEIPT);
    const wrapper = mountControls(
      {},
      settingsWith(" /work/project-b ", " team-ledger "),
    );

    await wrapper.find('[data-verdict="accept"]').trigger("click");
    await flushPromises();

    expect(vi.mocked(httpModule.httpPost).mock.calls[0][1]).toMatchObject({
      workspace_root: "/work/project-b",
      memory_namespace: "team-ledger",
    });
  });

  it("cannot attribute feedback without a workspace, so it offers none", async () => {
    const wrapper = mountControls({}, settingsWith("  "));

    for (const button of wrapper.findAll("button")) {
      expect(button.attributes("disabled")).toBeDefined();
    }
    await wrapper.find('[data-verdict="accept"]').trigger("click");
    await flushPromises();

    expect(httpModule.httpPost).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("codegenFeedback.noWorkspace");
  });

  it("keeps the form open and shows an error toast when the request fails", async () => {
    vi.mocked(httpModule.httpPost).mockRejectedValueOnce(new Error("backend down"));
    const wrapper = mountControls();

    await wrapper.find('[data-verdict="reject"]').trigger("click");
    await wrapper.find("textarea").setValue("broken");
    await wrapper.find(".file-feedback__submit").trigger("click");
    await flushPromises();

    const toasts = useUxStore().toasts;
    expect(toasts.map((toast) => toast.tone)).toEqual(["error"]);
    expect(toasts[0].message).toContain("backend down");
    expect(wrapper.find("textarea").exists()).toBe(true);
    expect(
      wrapper.find(".file-feedback__submit").attributes("disabled"),
    ).toBeUndefined();
  });
});

describe("DiffViewer feedback controls", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const diffText = [
    "diff --git a/src/a.py b/src/a.py",
    "@@ -1 +1 @@",
    "-x = 1",
    "+x = 2",
    "diff --git a/src/b.py b/src/b.py",
    "@@ -1 +1 @@",
    "+y = 3",
  ].join("\n");

  it("renders one control set per changed file of the run", () => {
    const wrapper = mount(DiffViewer, {
      props: {
        diffText,
        files: ["src/a.py", "src/b.py"],
        stats: { added: 2, removed: 1, files: 2 },
        source: "git",
        taskId: "task-9",
        editDiffs: { "src/b.py": "+y = 4" },
      },
      global: { provide: settingsWith("/work/project-a") },
    });

    const controls = wrapper.findAllComponents(FileFeedbackControls);
    expect(controls.map((control) => control.props("filePath"))).toEqual([
      "src/a.py",
      "src/b.py",
    ]);
    expect(controls[1].props("userEditDiff")).toBe("+y = 4");
  });

  it("offers feedback in the file-list mode too", () => {
    const wrapper = mount(DiffViewer, {
      props: {
        diffText: "",
        files: ["src/only.py"],
        stats: { added: 0, removed: 0, files: 1 },
        source: "file_list",
        taskId: "task-9",
      },
      global: { provide: settingsWith("/work/project-a") },
    });

    expect(wrapper.findAllComponents(FileFeedbackControls)).toHaveLength(1);
  });

  it("has no feedback controls without a task to attribute them to", () => {
    const wrapper = mount(DiffViewer, {
      props: {
        diffText,
        files: ["src/a.py", "src/b.py"],
        stats: { added: 2, removed: 1, files: 2 },
        source: "git",
      },
    });

    expect(wrapper.findAllComponents(FileFeedbackControls)).toHaveLength(0);
  });
});

describe("formatUserEditDiff", () => {
  it("keeps only the changed lines with +/- markers", () => {
    expect(formatUserEditDiff("a\nb\nc", "a\nB\nc")).toBe("-b\n+B");
  });
});
