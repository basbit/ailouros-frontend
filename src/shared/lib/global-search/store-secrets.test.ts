import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/endpoints/user-settings", () => ({
  getUserSettings: vi.fn(),
  putUserSettings: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/shared/lib/persistence-adapter", () => ({
  readTypedJson: vi.fn().mockReturnValue(null),
  writeTypedJson: vi.fn(),
}));
vi.mock("@/shared/lib/storage-keys", () => ({
  typedGlobalSettings: vi.fn().mockReturnValue("test-key"),
}));
vi.mock("@/shared/lib/frontend-logger", () => ({
  frontendLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { ApiError } from "@/shared/api/http";
import { getUserSettings, putUserSettings } from "@/shared/api/endpoints/user-settings";
import {
  flushGlobalSettingsSync,
  useGlobalSearchKeys,
  type GlobalSearchKeysState,
} from "@/shared/lib/global-search-keys";

describe("global settings store — server-held secrets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { state } = useGlobalSearchKeys();
    state.swarm_telegram_ingress_bot_token = "";
    state.tavily_api_key = "";
  });

  it("a save of an unrelated field never sends a secret set only in the server environment", async () => {
    vi.mocked(getUserSettings).mockResolvedValue({
      swarm_telegram_ingress_bot_token: "***",
      swarm_allow_command_exec: true,
      field_sources: {
        swarm_telegram_ingress_bot_token: "env",
        swarm_allow_command_exec: "env",
      },
    } as Partial<GlobalSearchKeysState>);
    const { state, setKey, loadFromBackend, sourceOf } = useGlobalSearchKeys();
    await loadFromBackend();
    expect(state.swarm_telegram_ingress_bot_token).toBe("***");
    expect(sourceOf("swarm_telegram_ingress_bot_token")).toBe("env");
    expect(state.swarm_allow_command_exec).toBe(true);

    setKey("swarm_telegram_ingress_allowed_chat_ids", "42");
    await flushGlobalSettingsSync();

    const payload = vi.mocked(putUserSettings).mock.calls.at(-1)?.[0];
    expect(payload).toEqual({ swarm_telegram_ingress_allowed_chat_ids: "42" });
    expect(sourceOf("swarm_telegram_ingress_bot_token")).toBe("env");
    vi.mocked(getUserSettings).mockReset();
  });

  it("keeps only the mask of a remote-control secret once the server accepted it", async () => {
    const { state, setKey } = useGlobalSearchKeys();
    setKey("swarm_telegram_ingress_bot_token", "123:real-token");
    setKey("tavily_api_key", "tvly-real");
    await flushGlobalSettingsSync();
    expect(vi.mocked(putUserSettings).mock.calls.at(-1)?.[0].swarm_telegram_ingress_bot_token).toBe(
      "123:real-token",
    );
    expect(state.swarm_telegram_ingress_bot_token).toBe("***");
    expect(state.tavily_api_key).toBe("tvly-real");
  });

  it("shows the server's reason when a save is refused, and clears it on the next good save", async () => {
    vi.mocked(putUserSettings).mockRejectedValueOnce(
      new ApiError("HTTP 400", 400, JSON.stringify({ detail: "swarm_x must be between 1 and 60" })),
    );
    const { state, setKey, syncError } = useGlobalSearchKeys();
    setKey("swarm_telegram_ingress_poll_timeout_seconds", "0");
    await flushGlobalSettingsSync();
    expect(syncError.value).toBe("swarm_x must be between 1 and 60");
    expect(state.swarm_telegram_ingress_bot_token).toBe("");

    setKey("swarm_telegram_ingress_poll_timeout_seconds", "25");
    await flushGlobalSettingsSync();
    expect(syncError.value).toBe("");
  });
});
