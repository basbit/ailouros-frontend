import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";
import {
  applyResearchSession,
  getResearchSession,
} from "@/shared/api/endpoints/autoresearch";
import { makeSession } from "./fixtures";

const postMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/shared/api/http", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/api/http")>();
  return {
    ...original,
    httpPost: (...args: unknown[]) => postMock(...args),
    httpGet: (...args: unknown[]) => getMock(...args),
  };
});

describe("autoresearch endpoints", () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
  });

  it("returns the session of a successful action", async () => {
    postMock.mockResolvedValue({ ok: true, error: null, session: makeSession() });

    const session = await applyResearchSession("s 1");

    expect(postMock).toHaveBeenCalledWith("/v1/autoresearch/sessions/s%201/apply", {});
    expect(session.id).toBe("s1");
  });

  it("surfaces the {ok:false,error} reason of a refused action", async () => {
    postMock.mockRejectedValue(
      new ApiError(
        "HTTP 409",
        409,
        JSON.stringify({ ok: false, error: "kept no improvement", session: null }),
      ),
    );

    await expect(applyResearchSession("s1")).rejects.toThrow("kept no improvement");
  });

  it("surfaces FastAPI detail on a failed read", async () => {
    getMock.mockRejectedValue(
      new ApiError("HTTP 404", 404, JSON.stringify({ detail: "does not exist" })),
    );

    await expect(getResearchSession("s1")).rejects.toThrow("does not exist");
  });
});
