import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import StreamingRagCard from "./StreamingRagCard.vue";
import {
  recordRetrievalDone,
  resetStreamingRagCard,
} from "@/features/streaming-rag/useStreamingRagCard";

describe("StreamingRagCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetStreamingRagCard();
  });

  it("renders nothing while there is no recorded retrieval event", () => {
    const wrapper = mount(StreamingRagCard);
    expect(wrapper.find(".streaming-rag-card").exists()).toBe(false);
  });

  it("renders the namespace, query, elapsed time, and per-chunk details", () => {
    recordRetrievalDone({
      namespace: "wiki",
      query: "deployment topology",
      elapsedMs: 1234,
      chunks: [
        {
          chunkId: "wiki/architecture#topology",
          score: 0.825,
          relPath: "wiki/architecture.md",
          section: "topology",
          snippet: "Hierarchical-mesh swarm with 8 agents…",
        },
      ],
    });
    const wrapper = mount(StreamingRagCard);
    const card = wrapper.find(".streaming-rag-card");
    expect(card.exists()).toBe(true);
    expect(card.text()).toContain("wiki");
    expect(card.text()).toContain("deployment topology");
    expect(card.text()).toContain("1.23 s");
    expect(card.text()).toContain("wiki/architecture#topology");
    expect(card.text()).toContain("wiki/architecture.md");
    expect(card.text()).toContain("topology");
    expect(card.text()).toContain("0.825");
    expect(card.text()).toContain("Hierarchical-mesh swarm");
  });

  it("renders the 'no chunks' empty state when the event carries an empty list", () => {
    recordRetrievalDone({
      namespace: "wiki",
      query: "no-hits query",
      elapsedMs: 50,
      chunks: [],
    });
    const wrapper = mount(StreamingRagCard);
    expect(wrapper.find(".streaming-rag-card__chunks").exists()).toBe(false);
    expect(wrapper.find(".streaming-rag-card__empty").exists()).toBe(true);
  });

  it("formats elapsed time in milliseconds when under a second", () => {
    recordRetrievalDone({
      namespace: "wiki",
      query: "fast",
      elapsedMs: 42,
      chunks: [],
    });
    const wrapper = mount(StreamingRagCard);
    expect(wrapper.text()).toContain("42 ms");
  });

  it("falls back to '—' when elapsedMs is non-finite", () => {
    recordRetrievalDone({
      namespace: "wiki",
      query: "weird",
      elapsedMs: Number.NaN,
      chunks: [],
    });
    const wrapper = mount(StreamingRagCard);
    // Both the elapsed and a missing-namespace fallback render '—';
    // we only need at least one occurrence.
    expect(wrapper.text()).toContain("—");
  });

  it("exposes an accessible name on the card section", () => {
    recordRetrievalDone({
      namespace: "wiki",
      query: "x",
      elapsedMs: 1,
      chunks: [],
    });
    const wrapper = mount(StreamingRagCard);
    const section = wrapper.find(".streaming-rag-card");
    expect(section.attributes("aria-label")).toBeTruthy();
  });
});
