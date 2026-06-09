import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/api/endpoints/user-settings", () => ({
  getUserSettings: vi.fn(),
  putUserSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/shared/lib/storage-utils", () => ({
  readTyped: vi.fn().mockReturnValue(null),
  writeTyped: vi.fn(),
}));

vi.mock("@/shared/lib/storage-keys", () => ({
  typedGlobalSettings: vi.fn().mockReturnValue("test-key"),
}));

vi.mock("@/shared/lib/frontend-logger", () => ({
  frontendLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import {
  useGlobalSearchKeys,
  type GlobalSearchKeysState,
} from "@/shared/lib/global-search-keys";
import { getUserSettings } from "@/shared/api/endpoints/user-settings";

describe("useGlobalSearchKeys.loadFromBackend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies new track-D retrieval flags from backend response", async () => {
    vi.mocked(getUserSettings).mockResolvedValueOnce({
      swarm_retrieval_crag: true,
      swarm_retrieval_hyde: true,
      swarm_retrieval_self_rag: true,
    } as Partial<GlobalSearchKeysState>);

    const { state, loadFromBackend } = useGlobalSearchKeys();
    await loadFromBackend();

    expect(state.swarm_retrieval_crag).toBe(true);
    expect(state.swarm_retrieval_hyde).toBe(true);
    expect(state.swarm_retrieval_self_rag).toBe(true);
  });

  it("applies new mcp server flags from backend response", async () => {
    vi.mocked(getUserSettings).mockResolvedValueOnce({
      swarm_github_mcp: false,
      swarm_context7: false,
      swarm_fetch_page: true,
    } as Partial<GlobalSearchKeysState>);

    const { state, loadFromBackend } = useGlobalSearchKeys();
    await loadFromBackend();

    expect(state.swarm_github_mcp).toBe(false);
    expect(state.swarm_context7).toBe(false);
    expect(state.swarm_fetch_page).toBe(true);
  });

  it("applies new string feature flag values from backend response", async () => {
    vi.mocked(getUserSettings).mockResolvedValueOnce({
      swarm_retrieval_rerank_model_id: "cross-encoder/test-model",
      swarm_orchestration_skill_dispatcher: "heuristic",
      swarm_sandbox_default_profile: "docker",
    } as Partial<GlobalSearchKeysState>);

    const { state, loadFromBackend } = useGlobalSearchKeys();
    await loadFromBackend();

    expect(state.swarm_retrieval_rerank_model_id).toBe("cross-encoder/test-model");
    expect(state.swarm_orchestration_skill_dispatcher).toBe("heuristic");
    expect(state.swarm_sandbox_default_profile).toBe("docker");
  });

  it("ignores masked secret values and keeps current state", async () => {
    const { state, setKey, loadFromBackend } = useGlobalSearchKeys();
    setKey("tavily_api_key", "tvly-real-secret");

    vi.mocked(getUserSettings).mockResolvedValueOnce({
      tavily_api_key: "***",
    } as Partial<GlobalSearchKeysState>);

    await loadFromBackend();

    expect(state.tavily_api_key).toBe("tvly-real-secret");
  });

  it("ignores undefined values in backend response", async () => {
    const { state, setKey, loadFromBackend } = useGlobalSearchKeys();
    setKey("swarm_pattern_memory", true);
    expect(state.swarm_pattern_memory).toBe(true);

    vi.mocked(getUserSettings).mockResolvedValueOnce({
      swarm_pattern_memory: undefined,
    } as unknown as Partial<GlobalSearchKeysState>);

    await loadFromBackend();
    expect(state.swarm_pattern_memory).toBe(true);
  });

  it("coerces non-bool truthy strings to true for boolean fields", async () => {
    vi.mocked(getUserSettings).mockResolvedValueOnce({
      swarm_retrieval_crag: "1" as unknown as boolean,
    } as Partial<GlobalSearchKeysState>);

    const { state, loadFromBackend } = useGlobalSearchKeys();
    await loadFromBackend();

    expect(state.swarm_retrieval_crag).toBe(true);
  });
});
