import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PeerReviewReportPanel from "./PeerReviewReportPanel.vue";
import type { PeerReviewReport } from "@/entities/review/model/types";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

describe("PeerReviewReportPanel", () => {
  const lgtmReport: PeerReviewReport = {
    verdict: "lgtm",
    findings: [],
    summary: "All 3 files passed verification.",
  };

  const criticalReport: PeerReviewReport = {
    verdict: "needs_fixes",
    findings: [
      {
        file_path: "app/auth.py",
        line_number: 14,
        severity: "CRITICAL",
        message: "Hardcoded secret detected",
      },
      {
        file_path: "app/utils.py",
        line_number: 30,
        severity: "WARNING",
        message: "Bare except clause",
      },
    ],
    summary: "Found 1 critical issue and 1 warning.",
  };

  it("does not render when report is null and not loading", () => {
    const wrapper = mount(PeerReviewReportPanel, {
      props: { report: null, loading: false },
    });
    expect(wrapper.find(".peer-review-panel").exists()).toBe(false);
  });

  it("renders LGTM report correctly with success badge", () => {
    const wrapper = mount(PeerReviewReportPanel, {
      props: { report: lgtmReport },
    });

    expect(wrapper.find(".peer-review-panel").exists()).toBe(true);
    expect(wrapper.find(".peer-review-badge--success").exists()).toBe(true);
    expect(wrapper.find(".peer-review-summary").text()).toBe(
      "All 3 files passed verification.",
    );
    expect(wrapper.find(".peer-review-empty").exists()).toBe(true);
  });

  it("renders needs_fixes report with findings list and emits inspectFile", async () => {
    const wrapper = mount(PeerReviewReportPanel, {
      props: { report: criticalReport },
    });

    expect(wrapper.find(".peer-review-badge--danger").exists()).toBe(true);
    const items = wrapper.findAll(".peer-review-finding-item");
    expect(items).toHaveLength(2);

    expect(items[0].text()).toContain("CRITICAL");
    expect(items[0].text()).toContain("app/auth.py:14");
    expect(items[0].text()).toContain("Hardcoded secret detected");

    const inspectBtn = items[0].find(".peer-review-inspect-btn");
    await inspectBtn.trigger("click");

    expect(wrapper.emitted("inspectFile")).toBeTruthy();
    expect(wrapper.emitted("inspectFile")![0]).toEqual([
      { path: "app/auth.py", line: 14 },
    ]);
  });

  it("renders the loading branch when a review is being fetched", () => {
    const wrapper = mount(PeerReviewReportPanel, {
      props: { report: null, loading: true },
    });
    expect(wrapper.find(".peer-review-loading").text()).toContain("peerReview.loading");
  });

  it("renders a retryable error branch when the fetch failed", async () => {
    const wrapper = mount(PeerReviewReportPanel, {
      props: { report: null, loading: false, error: "500 server error" },
    });

    expect(wrapper.find(".peer-review-error").exists()).toBe(true);
    expect(wrapper.text()).toContain("500 server error");

    await wrapper.find(".peer-review-error button").trigger("click");
    expect(wrapper.emitted("retry")).toBeTruthy();
  });
});
