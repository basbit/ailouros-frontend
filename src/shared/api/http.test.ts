import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpGet, httpPost } from "./http";
import { clearApiToken, setApiToken } from "./token";

function okResponse(): Response {
  return new Response("{}", { status: 200 });
}

function headersOfLastCall(fetchMock: ReturnType<typeof vi.fn>): Record<string, string> {
  const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
  return (init.headers ?? {}) as Record<string, string>;
}

describe("performRequest authorization", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    clearApiToken();
    fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("omits the Authorization header when no token is set", async () => {
    await httpGet("/v1/health");
    expect(headersOfLastCall(fetchMock).Authorization).toBeUndefined();
  });

  it("attaches a bearer header when a token is set", async () => {
    setApiToken("deploy-token");
    await httpGet("/v1/health");
    expect(headersOfLastCall(fetchMock).Authorization).toBe("Bearer deploy-token");
  });

  it("attaches the bearer header to write requests too", async () => {
    setApiToken("deploy-token");
    await httpPost("/v1/ws/ticket", { surface: "ui" });
    expect(headersOfLastCall(fetchMock).Authorization).toBe("Bearer deploy-token");
  });

  it("lets an explicit caller header win over the stored token", async () => {
    setApiToken("deploy-token");
    await httpGet("/v1/health", { headers: { Authorization: "Bearer explicit" } });
    expect(headersOfLastCall(fetchMock).Authorization).toBe("Bearer explicit");
  });
});
