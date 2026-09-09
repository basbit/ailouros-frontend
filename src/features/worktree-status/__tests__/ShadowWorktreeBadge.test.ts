import { describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ShadowWorktreeBadge from "../ShadowWorktreeBadge.vue";
import * as worktreeApi from "@/entities/worktree/api/worktree-api";

vi.mock("@/entities/worktree/api/worktree-api", () => ({
  getWorktreeStatus: vi.fn(),
  applyWorktree: vi.fn(),
  discardWorktree: vi.fn(),
}));

describe("ShadowWorktreeBadge", () => {
  it("renders nothing when shadow worktree is inactive", async () => {
    vi.mocked(worktreeApi.getWorktreeStatus).mockResolvedValue({
      is_active: false,
      task_id: "test-task",
      worktree_path: null,
      branch_name: null,
      has_changes: false,
      changed_files: [],
    });

    const wrapper = mount(ShadowWorktreeBadge, {
      props: {
        workspaceRoot: "/path/to/repo",
        taskId: "test-task",
      },
    });
    await flushPromises();

    expect(wrapper.find(".worktree-badge").exists()).toBe(false);
  });

  it("renders badge and triggers apply on button click", async () => {
    vi.mocked(worktreeApi.getWorktreeStatus).mockResolvedValue({
      is_active: true,
      task_id: "test-task",
      worktree_path: "/path/to/repo/.swarm/worktrees/test-task",
      branch_name: "swarm/test-task",
      has_changes: true,
      changed_files: ["src/app.py", "README.md"],
    });
    vi.mocked(worktreeApi.applyWorktree).mockResolvedValue({
      success: true,
      message: "Applied",
    });

    const wrapper = mount(ShadowWorktreeBadge, {
      props: {
        workspaceRoot: "/path/to/repo",
        taskId: "test-task",
      },
    });
    await flushPromises();

    expect(wrapper.find(".worktree-badge").exists()).toBe(true);
    expect(wrapper.text()).toContain("2");

    await wrapper.find(".worktree-badge__trigger").trigger("click");
    expect(wrapper.find(".worktree-badge__popover").exists()).toBe(true);

    const applyButton = wrapper.find(".worktree-badge__btn--apply");
    expect(applyButton.exists()).toBe(true);
    await applyButton.trigger("click");
    await flushPromises();

    expect(worktreeApi.applyWorktree).toHaveBeenCalledWith(
      "/path/to/repo",
      "test-task",
    );
    expect(wrapper.emitted("applied")).toBeTruthy();
  });
});
