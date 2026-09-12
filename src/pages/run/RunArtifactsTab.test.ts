import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import RunArtifactsTab from "./RunArtifactsTab.vue";

const mockRagVisible = ref(true);
const mockCitationsVisible = ref(true);

vi.mock("@/features/streaming-rag/useStreamingRagCard", () => ({
  useStreamingRagCard: () => ({
    visible: mockRagVisible,
  }),
}));

vi.mock("@/features/inline-citations/useInlineCitations", () => ({
  useInlineCitations: () => ({
    visible: mockCitationsVisible,
  }),
}));

vi.mock("@/features/peer-review-display/usePeerReview", () => ({
  usePeerReview: vi.fn(() => ({
    report: ref(null),
    loading: ref(false),
    error: ref(null),
    refresh: vi.fn(),
  })),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("RunArtifactsTab", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockRagVisible.value = true;
    mockCitationsVisible.value = true;
  });

  it("renders live streaming cards when in live mode", () => {
    const wrapper = mount(RunArtifactsTab, {
      props: {
        isHistory: false,
        taskId: "task-live",
      },
      global: {
        stubs: {
          StreamingRagCard: { template: "<div class='stub-rag' />" },
          InlineCitationList: { template: "<div class='stub-citations' />" },
          PeerReviewReportPanel: { template: "<div class='stub-peer-review' />" },
          ArtefactBrowser: { template: "<div class='stub-browser' />" },
          ArtefactEditorModal: { template: "<div class='stub-modal' />" },
        },
      },
    });

    expect(wrapper.find(".stub-rag").exists()).toBe(true);
    expect(wrapper.find(".stub-citations").exists()).toBe(true);
  });

  it("suppresses live streaming cards when in history mode", () => {
    const wrapper = mount(RunArtifactsTab, {
      props: {
        isHistory: true,
        taskId: "task-history",
      },
      global: {
        stubs: {
          StreamingRagCard: { template: "<div class='stub-rag' />" },
          InlineCitationList: { template: "<div class='stub-citations' />" },
          PeerReviewReportPanel: { template: "<div class='stub-peer-review' />" },
          ArtefactBrowser: { template: "<div class='stub-browser' />" },
          ArtefactEditorModal: { template: "<div class='stub-modal' />" },
        },
      },
    });

    expect(wrapper.find(".stub-rag").exists()).toBe(false);
    expect(wrapper.find(".stub-citations").exists()).toBe(false);
    expect(wrapper.find(".stub-browser").exists()).toBe(true);
  });
});
