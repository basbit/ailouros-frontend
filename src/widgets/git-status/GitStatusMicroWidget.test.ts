import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import GitStatusMicroWidget from "./GitStatusMicroWidget.vue";
import * as workspaceApi from "@/shared/api/endpoints/workspace";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

vi.mock("@/shared/api/endpoints/workspace", () => ({
  getGitStatus: vi.fn(),
}));

describe("GitStatusMicroWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when repository is not git", async () => {
    vi.mocked(workspaceApi.getGitStatus).mockResolvedValue({
      is_git: false,
    });

    const wrapper = mount(GitStatusMicroWidget, {
      props: {
        workspaceRoot: "/tmp/non-git",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(wrapper.find(".git-status-pill").exists()).toBe(false);
  });

  it("renders branch, clean status, and insertions/deletions", async () => {
    vi.mocked(workspaceApi.getGitStatus).mockResolvedValue({
      is_git: true,
      branch: "feature/login",
      clean: false,
      staged_count: 1,
      unstaged_count: 2,
      insertions: 45,
      deletions: 12,
      recent_commits: [
        {
          sha: "abc1234",
          message: "feat: implement auth",
          author: "Dev Agent",
          time_ago: "2m ago",
        },
      ],
    });

    const wrapper = mount(GitStatusMicroWidget, {
      props: {
        workspaceRoot: "/tmp/git-repo",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(wrapper.find(".git-status-pill").exists()).toBe(true);
    expect(wrapper.find(".git-status-pill__branch").text()).toBe("feature/login");
    expect(wrapper.find(".git-status-badge--dirty").text()).toContain("3");
    expect(wrapper.find(".git-status-delta--ins").text()).toBe("+45");
    expect(wrapper.find(".git-status-delta--del").text()).toBe("-12");

    // Popover is closed initially
    expect(wrapper.find(".git-status-popover").exists()).toBe(false);

    // Click pill to open popover
    await wrapper.find(".git-status-pill").trigger("click");
    expect(wrapper.find(".git-status-popover").exists()).toBe(true);
    expect(wrapper.find(".git-micro-graph__sha").text()).toBe("abc1234");
    expect(wrapper.find(".git-micro-graph__message").text()).toBe(
      "feat: implement auth",
    );
  });

  it("shows an error chip when the lookup fails instead of vanishing", async () => {
    vi.mocked(workspaceApi.getGitStatus).mockRejectedValue(new Error("boom"));

    const wrapper = mount(GitStatusMicroWidget, {
      props: { workspaceRoot: "/tmp/git-repo" },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(wrapper.find(".chip--failed").exists()).toBe(true);
    expect(wrapper.text()).toContain("gitStatus.error");
  });

  it("stops the 15s poll when the cached route is deactivated", async () => {
    vi.mocked(workspaceApi.getGitStatus).mockResolvedValue({ is_git: false });
    vi.useFakeTimers();

    // Every route lives inside <keep-alive>: leaving fires onDeactivated, not
    // onBeforeUnmount, so a poll cleaned up only on unmount ran forever.
    const KeepAliveHost = defineComponent({
      components: { GitStatusMicroWidget },
      props: { visible: { type: Boolean, default: true } },
      template: `<KeepAlive><GitStatusMicroWidget v-if="visible" workspace-root="/tmp/git-repo" /></KeepAlive>`,
    });

    const wrapper = mount(KeepAliveHost);
    const callsAfterMount = vi.mocked(workspaceApi.getGitStatus).mock.calls.length;

    await wrapper.setProps({ visible: false });
    vi.advanceTimersByTime(60_000);

    expect(vi.mocked(workspaceApi.getGitStatus).mock.calls.length).toBe(
      callsAfterMount,
    );
    vi.useRealTimers();
  });
});
