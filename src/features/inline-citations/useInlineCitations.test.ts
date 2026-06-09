import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import type { ResolvedCitation } from "@/entities/resolved-citation";
import { resetInlineCitationsCache, useInlineCitations } from "./useInlineCitations";

const resolveMock =
  vi.fn<
    (options: {
      chunkId: string;
      workspaceRoot: string | null;
    }) => Promise<ResolvedCitation>
  >();

vi.mock("@/shared/api/endpoints/citations", () => ({
  resolveCitation: (options: { chunkId: string; workspaceRoot: string | null }) =>
    resolveMock(options),
}));

function makeCitation(overrides: Partial<ResolvedCitation> = {}): ResolvedCitation {
  return {
    chunkId: "wiki/auth#login",
    relPath: "wiki/auth",
    section: "login",
    anchor: "login",
    snippet: "JWT verified server-side…",
    found: true,
    ...overrides,
  };
}

describe("useInlineCitations", () => {
  beforeEach(() => {
    resetInlineCitationsCache();
    resolveMock.mockReset();
  });

  it("returns null for blank chunk_id without hitting the network", async () => {
    const composable = useInlineCitations();
    const result = await composable.resolve("   ");
    expect(result).toBeNull();
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("calls the resolver once per chunk_id and caches the result", async () => {
    resolveMock.mockResolvedValue(makeCitation());
    const composable = useInlineCitations();
    await composable.resolve("wiki/auth#login");
    await composable.resolve("wiki/auth#login");
    expect(resolveMock).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent in-flight requests for the same chunk_id", async () => {
    let resolveSlow: ((value: ResolvedCitation) => void) | null = null;
    resolveMock.mockReturnValue(
      new Promise<ResolvedCitation>((res) => {
        resolveSlow = res;
      }),
    );
    const composable = useInlineCitations();
    const a = composable.resolve("wiki/auth#login");
    const b = composable.resolve("wiki/auth#login");
    expect(resolveMock).toHaveBeenCalledTimes(1);
    resolveSlow!(makeCitation());
    const [first, second] = await Promise.all([a, b]);
    expect(first?.chunkId).toBe("wiki/auth#login");
    expect(second?.chunkId).toBe("wiki/auth#login");
  });

  it("uses workspaceRoot as part of the cache key", async () => {
    resolveMock.mockResolvedValue(makeCitation());
    const wsRoot = ref<string | null>("/tmp/a");
    const composable = useInlineCitations({ workspaceRoot: wsRoot });
    await composable.resolve("wiki/auth#login");
    wsRoot.value = "/tmp/b";
    await composable.resolve("wiki/auth#login");
    expect(resolveMock).toHaveBeenCalledTimes(2);
  });

  it("records resolved citations into history, latest first", async () => {
    resolveMock.mockImplementation(({ chunkId }) =>
      Promise.resolve(makeCitation({ chunkId, section: chunkId.split("#")[1] })),
    );
    const composable = useInlineCitations();
    await composable.resolve("wiki/auth#login");
    await composable.resolve("wiki/auth#logout");
    expect(composable.history.value.map((c) => c.chunkId)).toEqual([
      "wiki/auth#logout",
      "wiki/auth#login",
    ]);
  });

  it("returns null when the resolver throws and records the error", async () => {
    resolveMock.mockRejectedValue(new Error("503 Service Unavailable"));
    const composable = useInlineCitations();
    const result = await composable.resolve("wiki/auth#login");
    expect(result).toBeNull();
    expect(composable.lastError.value).toBe("503 Service Unavailable");
  });
});
