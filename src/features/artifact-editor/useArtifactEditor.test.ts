import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useArtifactEditor } from "./useArtifactEditor";
import * as workspaceApi from "@/shared/api/endpoints/workspace";
import * as taskGatesApi from "@/shared/api/endpoints/task-gates";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/shared/api/endpoints/workspace", () => ({
  getWorkspaceFile: vi.fn(),
  patchWorkspaceFile: vi.fn(),
  approveWithEdits: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/task-gates", () => ({
  postConfirmHuman: vi.fn(),
}));

describe("useArtifactEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches content and updates editorContent", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "src/main.py",
      content: "line1\nline2",
    });

    const taskId = ref("task-1");
    const filePath = ref("src/main.py");
    const editor = useArtifactEditor({
      taskId,
      filePath,
    });

    await editor.fetchContent();

    expect(editor.editorContent.value).toBe("line1\nline2");
    expect(editor.lineCount.value).toBe(2);
    expect(editor.isDirty.value).toBe(false);
  });

  it("detects dirty state when editorContent is changed", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "src/main.py",
      content: "line1",
    });

    const editor = useArtifactEditor({
      taskId: ref("task-1"),
      filePath: ref("src/main.py"),
    });

    await editor.fetchContent();
    editor.editorContent.value = "line1 edited";

    expect(editor.isDirty.value).toBe(true);
    expect(editor.diffSummary.value.hasChanges).toBe(true);
  });

  it("saves changes and notifies onSaved callback", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "src/main.py",
      content: "initial",
    });
    vi.mocked(workspaceApi.patchWorkspaceFile).mockResolvedValue(undefined);

    const onSaved = vi.fn();
    const editor = useArtifactEditor({
      taskId: ref("task-1"),
      filePath: ref("src/main.py"),
      onSaved,
    });

    await editor.fetchContent();
    editor.editorContent.value = "saved text";
    await editor.onSave();

    expect(workspaceApi.patchWorkspaceFile).toHaveBeenCalledWith(
      "task-1",
      "src/main.py",
      "saved text",
    );
    expect(onSaved).toHaveBeenCalledWith({
      path: "src/main.py",
      content: "saved text",
    });
    expect(editor.isDirty.value).toBe(false);
  });

  it("approves with edits and triggers callbacks", async () => {
    vi.mocked(workspaceApi.getWorkspaceFile).mockResolvedValue({
      path: "src/main.py",
      content: "clean",
    });
    vi.mocked(workspaceApi.approveWithEdits).mockResolvedValue({
      ok: true,
      path: "src/main.py",
      gate_approved: true,
    });

    const onApproved = vi.fn();
    const onSaved = vi.fn();
    const editor = useArtifactEditor({
      taskId: ref("task-1"),
      filePath: ref("src/main.py"),
      onApproved,
      onSaved,
    });

    await editor.fetchContent();
    await editor.onApproveWithEdits();

    expect(workspaceApi.approveWithEdits).toHaveBeenCalledWith(
      "task-1",
      "src/main.py",
      "clean",
    );
    expect(onApproved).toHaveBeenCalledWith({ path: "src/main.py" });
    expect(onSaved).toHaveBeenCalledWith({ path: "src/main.py", content: "clean" });
  });

  it("submits reject feedback comment with line number prefix", async () => {
    vi.mocked(taskGatesApi.postConfirmHuman).mockResolvedValue(undefined);

    const onRejected = vi.fn();
    const editor = useArtifactEditor({
      taskId: ref("task-1"),
      filePath: ref("src/main.py"),
      onRejected,
    });

    editor.selectLineForFeedback(42);
    editor.rejectCommentText.value = "Fix variable naming";
    await editor.submitRejectComment();

    expect(taskGatesApi.postConfirmHuman).toHaveBeenCalledWith(
      "task-1",
      false,
      "Line 42: Fix variable naming",
    );
    expect(onRejected).toHaveBeenCalledWith({
      path: "src/main.py",
      comment: "Line 42: Fix variable naming",
    });
    expect(editor.showRejectComment.value).toBe(false);
  });
});
