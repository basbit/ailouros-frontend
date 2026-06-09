import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { flushPromises } from "@vue/test-utils";

vi.mock("@/shared/api/endpoints/workspace-feature-flag-overrides", () => ({
  getWorkspaceFeatureFlagOverrides: vi.fn(),
  saveWorkspaceFeatureFlagOverrides: vi.fn().mockResolvedValue({
    ok: true,
    path: "/tmp/.swarm/feature_flag_overrides.json",
    applied_env_vars: [],
  }),
}));

vi.mock("@/shared/lib/frontend-logger", () => ({
  frontendLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import {
  getWorkspaceFeatureFlagOverrides,
  saveWorkspaceFeatureFlagOverrides,
} from "@/shared/api/endpoints/workspace-feature-flag-overrides";
import { useWorkspaceFeatureFlagOverrides } from "@/features/global-settings/useWorkspaceFeatureFlagOverrides";

describe("useWorkspaceFeatureFlagOverrides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call backend when workspace root is empty", async () => {
    vi.mocked(getWorkspaceFeatureFlagOverrides).mockResolvedValue({});

    const workspaceRoot = ref("");
    useWorkspaceFeatureFlagOverrides(workspaceRoot);
    await flushPromises();

    expect(getWorkspaceFeatureFlagOverrides).not.toHaveBeenCalled();
  });

  it("loads overrides when workspace root is provided", async () => {
    vi.mocked(getWorkspaceFeatureFlagOverrides).mockResolvedValue({
      swarm_retrieval_crag: true,
    });

    const workspaceRoot = ref("/tmp/workspace");
    const { state, loadForCurrentWorkspace } =
      useWorkspaceFeatureFlagOverrides(workspaceRoot);
    await loadForCurrentWorkspace();
    await flushPromises();

    expect(getWorkspaceFeatureFlagOverrides).toHaveBeenCalledWith("/tmp/workspace");
    expect(state.overrides.swarm_retrieval_crag).toBe(true);
    expect(state.loaded).toBe(true);
  });

  it("isOverridden returns false for fields without an override", async () => {
    vi.mocked(getWorkspaceFeatureFlagOverrides).mockResolvedValue({
      swarm_retrieval_crag: true,
    });

    const workspaceRoot = ref("/tmp/workspace");
    const { isOverridden, loadForCurrentWorkspace } =
      useWorkspaceFeatureFlagOverrides(workspaceRoot);
    await loadForCurrentWorkspace();
    await flushPromises();

    expect(isOverridden("swarm_retrieval_crag")).toBe(true);
    expect(isOverridden("swarm_retrieval_hyde")).toBe(false);
  });

  it("setOverride writes to state and calls backend save", async () => {
    vi.mocked(getWorkspaceFeatureFlagOverrides).mockResolvedValue({});

    const workspaceRoot = ref("/tmp/workspace");
    const { setOverride, state, loadForCurrentWorkspace } =
      useWorkspaceFeatureFlagOverrides(workspaceRoot);
    await loadForCurrentWorkspace();
    await flushPromises();

    await setOverride("swarm_retrieval_crag", true);

    expect(state.overrides.swarm_retrieval_crag).toBe(true);
    expect(saveWorkspaceFeatureFlagOverrides).toHaveBeenCalledWith("/tmp/workspace", {
      swarm_retrieval_crag: true,
    });
  });

  it("removeOverride removes from state and calls backend save", async () => {
    vi.mocked(getWorkspaceFeatureFlagOverrides).mockResolvedValue({
      swarm_retrieval_crag: true,
      swarm_retrieval_hyde: true,
    });

    const workspaceRoot = ref("/tmp/workspace");
    const { removeOverride, state, isOverridden, loadForCurrentWorkspace } =
      useWorkspaceFeatureFlagOverrides(workspaceRoot);
    await loadForCurrentWorkspace();
    await flushPromises();

    await removeOverride("swarm_retrieval_crag");

    expect(isOverridden("swarm_retrieval_crag")).toBe(false);
    expect(state.overrides.swarm_retrieval_hyde).toBe(true);
    expect(saveWorkspaceFeatureFlagOverrides).toHaveBeenCalledWith("/tmp/workspace", {
      swarm_retrieval_hyde: true,
    });
  });

  it("removeOverride is a no-op when field is not overridden", async () => {
    vi.mocked(getWorkspaceFeatureFlagOverrides).mockResolvedValue({});

    const workspaceRoot = ref("/tmp/workspace");
    const { removeOverride, loadForCurrentWorkspace } =
      useWorkspaceFeatureFlagOverrides(workspaceRoot);
    await loadForCurrentWorkspace();
    await flushPromises();

    vi.clearAllMocks();
    await removeOverride("swarm_retrieval_crag");

    expect(saveWorkspaceFeatureFlagOverrides).not.toHaveBeenCalled();
  });

  it("reloads overrides when workspace root changes", async () => {
    vi.mocked(getWorkspaceFeatureFlagOverrides)
      .mockResolvedValueOnce({ swarm_retrieval_crag: true })
      .mockResolvedValueOnce({ swarm_retrieval_hyde: true });

    const workspaceRoot = ref("/tmp/workspace-a");
    const { state, loadForCurrentWorkspace } =
      useWorkspaceFeatureFlagOverrides(workspaceRoot);
    await loadForCurrentWorkspace();
    expect(state.overrides.swarm_retrieval_crag).toBe(true);

    workspaceRoot.value = "/tmp/workspace-b";
    await flushPromises();
    expect(state.overrides.swarm_retrieval_hyde).toBe(true);
    expect(state.overrides.swarm_retrieval_crag).toBeUndefined();
  });
});
