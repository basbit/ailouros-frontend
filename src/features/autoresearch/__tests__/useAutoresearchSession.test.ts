import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { ResearchSession } from "@/shared/api/endpoints/autoresearch";
import { POLL_INTERVAL_MS, useAutoresearchSession } from "../useAutoresearchSession";
import { makeSession } from "./fixtures";

const getMock = vi.fn<(id: string) => Promise<ResearchSession>>();
const cancelMock = vi.fn<(id: string) => Promise<ResearchSession>>();
const applyMock = vi.fn<(id: string) => Promise<ResearchSession>>();

vi.mock("@/shared/api/endpoints/autoresearch", () => ({
  getResearchSession: (id: string) => getMock(id),
  cancelResearchSession: (id: string) => cancelMock(id),
  applyResearchSession: (id: string) => applyMock(id),
  discardResearchSession: vi.fn(),
  openResearchPullRequest: vi.fn(),
}));

function mountComposable() {
  let api!: ReturnType<typeof useAutoresearchSession>;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useAutoresearchSession();
        return () => h("div");
      },
    }),
  );
  return { api, wrapper };
}

describe("useAutoresearchSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getMock.mockReset();
    cancelMock.mockReset();
    applyMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls every 2 seconds while the session runs and stops once it finishes", async () => {
    getMock
      .mockResolvedValueOnce(makeSession({ status: "running" }))
      .mockResolvedValueOnce(makeSession({ status: "running" }))
      .mockResolvedValueOnce(makeSession({ status: "completed" }));
    const { api } = mountComposable();

    await api.open("s1");
    expect(getMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS - 1);
    expect(getMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(getMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(api.session.value?.status).toBe("completed");

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 5);
    expect(getMock).toHaveBeenCalledTimes(3);
  });

  it("does not poll a finished session", async () => {
    getMock.mockResolvedValue(makeSession({ status: "failed" }));
    const { api } = mountComposable();

    await api.open("s1");
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);

    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("stops polling when the component unmounts", async () => {
    getMock.mockResolvedValue(makeSession({ status: "running" }));
    const { api, wrapper } = mountComposable();

    await api.open("s1");
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);

    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("keeps polling after a cancel until the session reports cancelled", async () => {
    getMock.mockResolvedValueOnce(makeSession({ status: "running" }));
    cancelMock.mockResolvedValue(makeSession({ status: "running" }));
    const { api } = mountComposable();
    await api.open("s1");
    getMock.mockResolvedValue(makeSession({ status: "cancelled" }));

    expect(await api.run("cancel")).toBe(true);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    expect(cancelMock).toHaveBeenCalledWith("s1");
    expect(api.session.value?.status).toBe("cancelled");
  });

  it("ignores a poll response that was in flight when an action answered", async () => {
    getMock.mockResolvedValueOnce(makeSession({ status: "running" }));
    const { api } = mountComposable();
    await api.open("s1");
    let answerPoll!: (value: ResearchSession) => void;
    getMock.mockReturnValueOnce(
      new Promise<ResearchSession>((resolve) => {
        answerPoll = resolve;
      }),
    );
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    expect(getMock).toHaveBeenCalledTimes(2);
    cancelMock.mockResolvedValue(makeSession({ status: "cancelled" }));

    expect(await api.run("cancel")).toBe(true);
    answerPoll(makeSession({ status: "running" }));
    await flushPromises();

    expect(api.session.value?.status).toBe("cancelled");
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 3);
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("shows the backend reason when an action fails", async () => {
    getMock.mockResolvedValue(makeSession({ status: "completed" }));
    applyMock.mockRejectedValue(new Error("does not apply cleanly"));
    const { api } = mountComposable();
    await api.open("s1");

    expect(await api.run("apply")).toBe(false);

    expect(api.actionError.value).toBe("does not apply cleanly");
    expect(api.busyAction.value).toBeNull();
  });

  it("reports a load failure", async () => {
    getMock.mockRejectedValue(new Error("autoresearch session s9 does not exist"));
    const { api } = mountComposable();

    await api.open("s9");
    await flushPromises();

    expect(api.loadError.value).toContain("does not exist");
  });
});
