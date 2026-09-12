import { beforeEach, describe, expect, it, vi } from "vitest";

const httpPostMock = vi.fn();

vi.mock("@/shared/api/http", () => ({
  httpPost: (path: string, body?: unknown) => httpPostMock(path, body),
}));

import {
  getCoworkingWebSocketUrl,
  getScreencastWebSocketUrl,
  getTerminalWebSocketUrl,
  getUiWebSocketUrl,
} from "./ws";

describe("websocket url builders", () => {
  beforeEach(() => {
    httpPostMock.mockReset();
    httpPostMock.mockResolvedValue({
      ticket: "minted-ticket",
      surface: "ui",
      expires_in: 30,
    });
  });

  it("mints a ui ticket and puts it in the query string", async () => {
    const url = new URL(await getUiWebSocketUrl());
    expect(httpPostMock).toHaveBeenCalledWith("/v1/ws/ticket", { surface: "ui" });
    expect(url.pathname).toBe("/ws/ui");
    expect(url.searchParams.get("ticket")).toBe("minted-ticket");
    expect(url.protocol).toBe("ws:");
  });

  it("scopes the screencast ticket to the screencast surface", async () => {
    const url = new URL(await getScreencastWebSocketUrl("task 1"));
    expect(httpPostMock).toHaveBeenCalledWith("/v1/ws/ticket", {
      surface: "screencast",
    });
    expect(url.pathname).toBe("/ws/screencast/task%201");
    expect(url.searchParams.get("ticket")).toBe("minted-ticket");
  });

  it("scopes the coworking ticket to the coworking surface", async () => {
    const url = new URL(await getCoworkingWebSocketUrl("space-a"));
    expect(httpPostMock).toHaveBeenCalledWith("/v1/ws/ticket", {
      surface: "coworking",
    });
    expect(url.pathname).toBe("/ws/coworking/space-a");
    expect(url.searchParams.get("ticket")).toBe("minted-ticket");
  });

  it("keeps the workspace_root parameter alongside the terminal ticket", async () => {
    const url = new URL(await getTerminalWebSocketUrl("task-9", "/repo/demo"));
    expect(httpPostMock).toHaveBeenCalledWith("/v1/ws/ticket", {
      surface: "terminal",
    });
    expect(url.pathname).toBe("/ws/terminal/task-9");
    expect(url.searchParams.get("workspace_root")).toBe("/repo/demo");
    expect(url.searchParams.get("ticket")).toBe("minted-ticket");
  });

  it("never carries a raw api token in the url", async () => {
    const url = new URL(await getUiWebSocketUrl());
    expect(url.searchParams.get("token")).toBeNull();
  });

  it("propagates a minting failure instead of opening an unauthorised socket", async () => {
    httpPostMock.mockRejectedValue(new Error("HTTP 401"));
    await expect(getUiWebSocketUrl()).rejects.toThrow("HTTP 401");
  });
});
