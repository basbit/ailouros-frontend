import { beforeEach, describe, expect, it } from "vitest";

import type { RetrievalDoneEvent } from "@/entities/retrieval-done";

import {
  recordRetrievalDone,
  resetStreamingRagCard,
  useStreamingRagCard,
} from "./useStreamingRagCard";

function makeEvent(overrides: Partial<RetrievalDoneEvent> = {}): RetrievalDoneEvent {
  return {
    namespace: "wiki",
    query: "hello",
    elapsedMs: 100,
    chunks: [],
    ...overrides,
  };
}

describe("useStreamingRagCard", () => {
  beforeEach(() => {
    resetStreamingRagCard();
  });

  it("starts invisible and clears via the composable's reset", () => {
    const card = useStreamingRagCard();
    expect(card.visible.value).toBe(false);
    expect(card.latest.value).toBeNull();
  });

  it("becomes visible after recordRetrievalDone", () => {
    const card = useStreamingRagCard();
    recordRetrievalDone(makeEvent({ query: "first" }));
    expect(card.visible.value).toBe(true);
    expect(card.latest.value?.query).toBe("first");
  });

  it("shares state across multiple composable calls (module-level ref)", () => {
    const a = useStreamingRagCard();
    const b = useStreamingRagCard();
    recordRetrievalDone(makeEvent({ query: "shared" }));
    expect(a.latest.value?.query).toBe("shared");
    expect(b.latest.value?.query).toBe("shared");
  });

  it("rotates older events into history, latest first", () => {
    const card = useStreamingRagCard();
    recordRetrievalDone(makeEvent({ query: "older" }));
    recordRetrievalDone(makeEvent({ query: "newer" }));
    expect(card.latest.value?.query).toBe("newer");
    expect(card.history.value).toHaveLength(1);
    expect(card.history.value[0]?.query).toBe("older");
  });

  it("caps history length so long-running pipelines don't leak memory", () => {
    for (let i = 0; i < 50; i += 1) {
      recordRetrievalDone(makeEvent({ query: `q${i}` }));
    }
    const card = useStreamingRagCard();
    expect(card.history.value.length).toBeLessThanOrEqual(12);
  });

  it("clear() returns the composable to its initial state", () => {
    const card = useStreamingRagCard();
    recordRetrievalDone(makeEvent());
    card.clear();
    expect(card.visible.value).toBe(false);
    expect(card.latest.value).toBeNull();
    expect(card.history.value).toEqual([]);
  });
});
