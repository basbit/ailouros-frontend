import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRemoteApiProfiles } from "./useRemoteApiProfiles";
import type { RemoteProfileRow } from "@/entities/remote-profile";
import { LS_REMOTE_PROFILES } from "@/shared/lib/swarm-ui-constants";

function storedRows(): RemoteProfileRow[] {
  return JSON.parse(localStorage.getItem(LS_REMOTE_PROFILES) ?? "[]");
}

describe("useRemoteApiProfiles — global persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("persists every mutation to the global store", () => {
    const state = useRemoteApiProfiles(vi.fn());
    state.addProfile({ id: "or", provider: "openrouter", api_key: "k" });
    expect(storedRows()).toEqual([
      expect.objectContaining({ id: "or", provider: "openrouter", api_key: "k" }),
    ]);

    state.updateProfile(0, "api_key", "k2");
    expect(storedRows()[0].api_key).toBe("k2");

    state.removeProfile(0);
    expect(storedRows()).toEqual([]);
  });

  it("loadGlobal reads back what a previous instance saved", () => {
    const first = useRemoteApiProfiles(vi.fn());
    first.addProfile({ id: "gem", provider: "google", api_key: "g" });

    const second = useRemoteApiProfiles(vi.fn());
    second.loadGlobal();
    expect(second.profiles.value).toEqual([
      expect.objectContaining({ id: "gem", provider: "google" }),
    ]);
  });

  it("adoptLegacyRows migrates project rows only when the global store is empty", () => {
    const state = useRemoteApiProfiles(vi.fn());
    state.loadGlobal();
    state.adoptLegacyRows([
      { id: "legacy", provider: "anthropic", api_key: "a", base_url: "" },
    ]);
    expect(state.profiles.value).toEqual([
      expect.objectContaining({ id: "legacy", provider: "anthropic" }),
    ]);
    expect(storedRows()).toEqual([
      expect.objectContaining({ id: "legacy", provider: "anthropic" }),
    ]);
  });

  it("adoptLegacyRows is a no-op once profiles already exist", () => {
    const state = useRemoteApiProfiles(vi.fn());
    state.addProfile({ id: "keep", provider: "openrouter", api_key: "k" });
    state.adoptLegacyRows([
      { id: "legacy", provider: "anthropic", api_key: "a", base_url: "" },
    ]);
    expect(state.profiles.value).toEqual([
      expect.objectContaining({ id: "keep", provider: "openrouter" }),
    ]);
  });
});
