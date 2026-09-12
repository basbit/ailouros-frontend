import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startSwarmChatStream } from "../onboarding";
import {
  postContinueStream,
  postHumanResumeStream,
  postRetryStream,
} from "../task-gates";
import { clearApiToken, setApiToken } from "../../token";

type StreamCall = () => Promise<Response>;

const STREAM_CALLS: Array<[string, StreamCall]> = [
  ["startSwarmChatStream", () => startSwarmChatStream({ prompt: "hi" })],
  ["postHumanResumeStream", () => postHumanResumeStream("t-1", "go on")],
  ["postRetryStream", () => postRetryStream("t-1", { stream: true })],
  ["postContinueStream", () => postContinueStream("t-1", "more", ["dev"])],
];

function headersOfLastCall(
  fetchMock: ReturnType<typeof vi.fn>,
): Record<string, string> {
  const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
  return (init.headers ?? {}) as Record<string, string>;
}

describe("streaming endpoints go through the shared transport", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    clearApiToken();
    fetchMock = vi.fn(async () => new Response("data: {}\n\n", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  for (const [name, call] of STREAM_CALLS) {
    it(`${name} sends the bearer header when a token is set`, async () => {
      setApiToken("deploy-token");
      await call();
      expect(headersOfLastCall(fetchMock).Authorization).toBe("Bearer deploy-token");
    });

    it(`${name} omits the bearer header when no token is set`, async () => {
      await call();
      expect(headersOfLastCall(fetchMock).Authorization).toBeUndefined();
    });

    it(`${name} still sends JSON content type and a serialised body`, async () => {
      await call();
      const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
      expect(headersOfLastCall(fetchMock)["Content-Type"]).toBe("application/json");
      expect(typeof init.body).toBe("string");
    });

    it(`${name} returns a non-ok response instead of throwing`, async () => {
      fetchMock.mockResolvedValueOnce(new Response("nope", { status: 401 }));
      const response = await call();
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  }
});
