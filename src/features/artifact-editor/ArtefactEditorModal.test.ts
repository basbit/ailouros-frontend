import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ArtefactEditorModal from "./ArtefactEditorModal.vue";
import * as workspaceApi from "@/shared/api/endpoints/workspace";
import * as taskGatesApi from "@/shared/api/endpoints/task-gates";
import { useUxStore } from "@/shared/store/ux";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

vi.mock("@/shared/api/endpoints/workspace", () => ({
  getWorkspaceFile: vi.fn(),
  patchWorkspaceFile: vi.fn(),
  approveWithEdits: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/task-gates", () => ({
  postConfirmHuman: vi.fn(),
}));

describe("ArtefactEditorModal", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("does not render when visible is false", () => {
    const wrapper = mount(ArtefactEditorModal, {
      props: {
        visible: false,
        taskId: "task-123",
        filePath: "app/main.py",
      },
    });

    expect(wrapper.find(".artefact-editor-modal").exists()).toBe(false);
  });

  it("fetches file content and displays line count when visible is true", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "app/main.py",
      content: "print('hello')\nprint('world')",
    });

    const wrapper = mount(ArtefactEditorModal, {
      props: {
        visible: true,
        taskId: "task-123",
        filePath: "app/main.py",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(workspaceApi.getWorkspaceFile).toHaveBeenCalledWith(
      "task-123",
      "app/main.py",
    );
    const textarea = wrapper.find<HTMLTextAreaElement>(".artefact-editor-textarea");
    expect(textarea.element.value).toBe("print('hello')\nprint('world')");
    expect(wrapper.text()).toContain("2");
  });

  it("saves modified content and emits saved", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "app/main.py",
      content: "original content",
    });
    vi.mocked(workspaceApi.patchWorkspaceFile).mockResolvedValue(undefined);

    const wrapper = mount(ArtefactEditorModal, {
      props: {
        visible: true,
        taskId: "task-123",
        filePath: "app/main.py",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const textarea = wrapper.find<HTMLTextAreaElement>(".artefact-editor-textarea");
    await textarea.setValue("modified content");

    const saveBtn = wrapper.find<HTMLButtonElement>(".artefact-btn--primary");
    expect(saveBtn.attributes("disabled")).toBeUndefined();
    await saveBtn.trigger("click");

    expect(workspaceApi.patchWorkspaceFile).toHaveBeenCalledWith(
      "task-123",
      "app/main.py",
      "modified content",
    );
    expect(wrapper.emitted("saved")).toBeTruthy();
    expect(wrapper.emitted("saved")![0]).toEqual([
      { path: "app/main.py", content: "modified content" },
    ]);
  });

  it("switches to diff tab and shows diff rows", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "app/main.py",
      content: "line 1\nline 2",
    });

    const wrapper = mount(ArtefactEditorModal, {
      props: {
        visible: true,
        taskId: "task-123",
        filePath: "app/main.py",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const textarea = wrapper.find<HTMLTextAreaElement>(".artefact-editor-textarea");
    await textarea.setValue("line 1\nline 2 modified\nline 3");

    const tabs = wrapper.findAll(".artefact-tab-btn");
    expect(tabs.length).toBe(2);
    await tabs[1].trigger("click");

    expect(wrapper.find(".artefact-diff-container").exists()).toBe(true);
    expect(wrapper.findAll(".artefact-diff-row").length).toBeGreaterThan(0);
  });

  it("approves with edits and emits approved", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "app/main.py",
      content: "line 1",
    });
    vi.mocked(workspaceApi.approveWithEdits).mockResolvedValue({
      ok: true,
      path: "app/main.py",
      gate_approved: true,
    });

    const wrapper = mount(ArtefactEditorModal, {
      props: {
        visible: true,
        taskId: "task-123",
        filePath: "app/main.py",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const approveBtn = wrapper.find(".artefact-btn--success");
    await approveBtn.trigger("click");

    expect(workspaceApi.approveWithEdits).toHaveBeenCalledWith(
      "task-123",
      "app/main.py",
      "line 1",
    );
    expect(wrapper.emitted("approved")).toBeTruthy();
    expect(wrapper.emitted("saved")).toBeTruthy();
  });

  it("rejects with line comment and calls postConfirmHuman", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "app/main.py",
      content: "line 1",
    });
    vi.mocked(taskGatesApi.postConfirmHuman).mockResolvedValue(undefined);

    const wrapper = mount(ArtefactEditorModal, {
      props: {
        visible: true,
        taskId: "task-123",
        filePath: "app/main.py",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const rejectToggleBtn = wrapper.find(".artefact-btn--warning");
    await rejectToggleBtn.trigger("click");

    expect(wrapper.find(".artefact-reject-box").exists()).toBe(true);

    const commentInput = wrapper.find<HTMLInputElement>(
      ".artefact-reject-comment-input",
    );
    await commentInput.setValue("Please rewrite this function");

    const submitFeedbackBtn = wrapper.find<HTMLButtonElement>(
      ".artefact-reject-box .artefact-btn--warning",
    );
    await submitFeedbackBtn.trigger("click");

    expect(taskGatesApi.postConfirmHuman).toHaveBeenCalledWith(
      "task-123",
      false,
      "Line 1: Please rewrite this function",
    );
    expect(wrapper.emitted("rejected")).toBeTruthy();
  });

  it("emits close when close button is clicked", async () => {
    const wrapper = mount(ArtefactEditorModal, {
      props: {
        visible: true,
        taskId: "task-123",
        filePath: "app/main.py",
      },
    });

    const closeBtn = wrapper.find(".artefact-btn--ghost");
    await closeBtn.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("closes on Escape without needing a click inside first", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "app/main.py",
      content: "print('hello')",
    });

    const wrapper = mount(ArtefactEditorModal, {
      props: { visible: true, taskId: "task-123", filePath: "app/main.py" },
      attachTo: document.body,
    });
    await flushPromises();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();

    expect(wrapper.emitted("close")).toBeTruthy();
    wrapper.unmount();
  });

  it("asks before throwing away unsaved edits", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "app/main.py",
      content: "print('hello')",
    });

    const wrapper = mount(ArtefactEditorModal, {
      props: { visible: true, taskId: "task-123", filePath: "app/main.py" },
    });
    await flushPromises();

    await wrapper.find(".artefact-editor-textarea").setValue("print('edited')");
    await flushPromises();

    const ux = useUxStore();
    const confirmSpy = vi.spyOn(ux, "confirmDialog").mockResolvedValue(false);

    await wrapper.find(".artefact-btn--ghost").trigger("click");
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toBeFalsy();

    confirmSpy.mockResolvedValue(true);
    await wrapper.find(".artefact-btn--ghost").trigger("click");
    await flushPromises();
    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
