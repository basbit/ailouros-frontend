import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ShadowWorktreeBadge from "../ShadowWorktreeBadge.vue";
import { useUxStore } from "@/shared/store/ux";
import * as worktreeApi from "@/entities/worktree/api/worktree-api";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${Object.values(params).join(",")}` : key,
  }),
}));

const ACTIVE_STATUS = {
  is_active: true,
  task_id: "test-task",
  worktree_path: "/path/to/repo/.swarm/worktrees/test-task",
  branch_name: "swarm/test-task",
  has_changes: true,
  changed_files: ["src/app.py", "README.md"],
};

vi.mock("@/entities/worktree/api/worktree-api", () => ({
  getWorktreeStatus: vi.fn(),
  applyWorktree: vi.fn(),
  discardWorktree: vi.fn(),
}));

describe("ShadowWorktreeBadge", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(worktreeApi.getWorktreeStatus).mockReset();
    vi.mocked(worktreeApi.applyWorktree).mockReset();
    vi.mocked(worktreeApi.discardWorktree).mockReset();
  });

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

  it("refetches when the header switches to another run", async () => {
    vi.mocked(worktreeApi.getWorktreeStatus).mockResolvedValue({
      ...ACTIVE_STATUS,
      branch_name: "swarm/task-one",
    });

    const wrapper = mount(ShadowWorktreeBadge, {
      props: { workspaceRoot: "/path/to/repo", taskId: "task-one" },
    });
    await flushPromises();
    await wrapper.find(".worktree-badge__trigger").trigger("click");
    expect(wrapper.find(".worktree-badge__branch").text()).toBe("swarm/task-one");

    // The badge lives in the header, which is never remounted on a run switch.
    vi.mocked(worktreeApi.getWorktreeStatus).mockResolvedValue({
      ...ACTIVE_STATUS,
      branch_name: "swarm/task-two",
    });
    await wrapper.setProps({ taskId: "task-two" });
    await flushPromises();

    expect(worktreeApi.getWorktreeStatus).toHaveBeenLastCalledWith(
      "/path/to/repo",
      "task-two",
    );
    await wrapper.find(".worktree-badge__trigger").trigger("click");
    expect(wrapper.find(".worktree-badge__branch").text()).toBe("swarm/task-two");
  });

  it("reports a failed apply instead of showing nothing at all", async () => {
    vi.mocked(worktreeApi.getWorktreeStatus).mockResolvedValue(ACTIVE_STATUS);
    vi.mocked(worktreeApi.applyWorktree).mockRejectedValue(new Error("merge conflict"));
    const ux = useUxStore();

    const wrapper = mount(ShadowWorktreeBadge, {
      props: { workspaceRoot: "/path/to/repo", taskId: "test-task" },
    });
    await flushPromises();
    await wrapper.find(".worktree-badge__trigger").trigger("click");
    await wrapper.find(".worktree-badge__btn--apply").trigger("click");
    await flushPromises();

    expect(wrapper.emitted("applied")).toBeFalsy();
    expect(ux.toasts.length).toBe(1);
    expect(ux.toasts[0].tone).toBe("error");
    expect(ux.toasts[0].message).toContain("worktree.applyFailed");
  });
});
