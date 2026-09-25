import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";
import { getEffectMetrics } from "@/shared/api/endpoints/effect-metrics";
import { makeReport } from "./fixtures";

const getMock = vi.fn();

vi.mock("@/shared/api/http", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/api/http")>();
  return { ...original, httpGet: (...args: unknown[]) => getMock(...args) };
});

describe("getEffectMetrics", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("sends the period and the workspace filter", async () => {
    getMock.mockResolvedValue({ ok: true, error: null, report: makeReport() });

    await getEffectMetrics({
      from: "2026-09-10",
      to: "2026-09-16",
      workspaceRoot: "/work/a b",
    });

    expect(getMock).toHaveBeenCalledWith(
      "/v1/metrics/effect?from=2026-09-10&to=2026-09-16&workspace_root=%2Fwork%2Fa+b",
    );
  });

  it("leaves the workspace filter out when none is chosen", async () => {
    getMock.mockResolvedValue({ ok: true, error: null, report: makeReport() });

    await getEffectMetrics({ from: "2026-09-10", to: "2026-09-16", workspaceRoot: "" });

    expect(getMock).toHaveBeenCalledWith(
      "/v1/metrics/effect?from=2026-09-10&to=2026-09-16",
    );
  });

  it("surfaces the refusal reason of a 400", async () => {
    getMock.mockRejectedValue(
      new ApiError(
        "HTTP 400",
        400,
        JSON.stringify({ ok: false, error: "period is reversed", report: null }),
      ),
    );

    await expect(
      getEffectMetrics({ from: "2026-09-16", to: "2026-09-10", workspaceRoot: "" }),
    ).rejects.toThrow("period is reversed");
  });
});
