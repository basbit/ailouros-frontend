import { describe, expect, it, vi, beforeEach } from "vitest";

const http = vi.hoisted(() => ({
  httpGet: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock("@/shared/api/http", () => http);

import { getSpecAncestors, getSpecDependants, getSpecOrphans } from "./spec";

beforeEach(() => {
  http.httpGet.mockReset();
});

describe("spec graph relation endpoints", () => {
  it("getSpecAncestors builds the ancestors path and query", async () => {
    http.httpGet.mockResolvedValue({
      spec_id: "spec:auth",
      depth: 2,
      ancestors: ["spec:base"],
    });
    const result = await getSpecAncestors("/workspace", "spec:auth", 2);
    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/spec%3Aauth/ancestors?workspace_root=%2Fworkspace&depth=2",
    );
    expect(result.ancestors).toEqual(["spec:base"]);
    expect(result.depth).toBe(2);
  });

  it("getSpecAncestors uses default depth when omitted", async () => {
    http.httpGet.mockResolvedValue({
      spec_id: "spec:auth",
      depth: 1,
      ancestors: [],
    });
    await getSpecAncestors("/workspace", "spec:auth");
    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/spec%3Aauth/ancestors?workspace_root=%2Fworkspace&depth=1",
    );
  });

  it("getSpecAncestors omits depth when below the valid range", async () => {
    http.httpGet.mockResolvedValue({
      spec_id: "spec:auth",
      depth: 0,
      ancestors: [],
    });
    await getSpecAncestors("/workspace", "spec:auth", 0);
    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/spec%3Aauth/ancestors?workspace_root=%2Fworkspace",
    );
  });

  it("getSpecDependants builds the dependants path and query", async () => {
    http.httpGet.mockResolvedValue({
      spec_id: "spec:auth",
      depth: 1,
      dependants: ["code:auth.ts"],
    });
    const result = await getSpecDependants("/workspace", "spec:auth", 1);
    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/spec%3Aauth/dependants?workspace_root=%2Fworkspace&depth=1",
    );
    expect(result.dependants).toEqual(["code:auth.ts"]);
  });

  it("preserves slashes in :path-style spec ids and encodes special chars", async () => {
    http.httpGet.mockResolvedValue({ spec_id: "", depth: 1, ancestors: [] });
    await getSpecAncestors("/workspace", "docs/auth/index");
    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/docs/auth/index/ancestors?workspace_root=%2Fworkspace&depth=1",
    );
  });

  it("getSpecOrphans builds the orphans query with default anchor", async () => {
    http.httpGet.mockResolvedValue({
      anchor: "_project",
      orphans: ["spec:lonely"],
    });
    const result = await getSpecOrphans("/workspace");
    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/orphans?workspace_root=%2Fworkspace&anchor=_project",
    );
    expect(result.orphans).toEqual(["spec:lonely"]);
  });
});
