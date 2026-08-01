import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import CheckpointPreview from "./CheckpointPreview.vue";

const PREVIEW = {
  step_id: "human_qa",
  concerns: [{ path: "app/auth/login.py", tags: ["auth", "security"] }],
  risk_hotspots: [
    {
      what: "auth bypass on empty token",
      where: ["app/auth/login.py"],
      tags: ["auth"],
      severity: "P0",
    },
  ],
  manual_checks: [
    { do: "exercise app/auth/login.py", expect: "no sign of: auth bypass" },
  ],
  deferred: [{ title: "unused import", step_id: "review_dev", blocking: false }],
};

function mountPreview(raw: unknown) {
  return mount(CheckpointPreview, { props: { preview: raw } });
}

describe("CheckpointPreview", () => {
  it("renders nothing when there is no preview", () => {
    expect(mountPreview(null).find("section.checkpoint-preview").exists()).toBe(false);
    expect(mountPreview(null).text()).toBe("");
  });

  it("shows the changed files with their tags", () => {
    const text = mountPreview(PREVIEW).text();

    expect(text).toContain("app/auth/login.py");
    expect(text).toContain("auth");
    expect(text).toContain("security");
  });

  it("shows risk hotspots with severity ahead of the rest", () => {
    const text = mountPreview(PREVIEW).text();

    expect(text).toContain("auth bypass on empty token");
    expect(text).toContain("P0");
  });

  it("shows the manual checks with what to expect", () => {
    const text = mountPreview(PREVIEW).text();

    expect(text).toContain("exercise app/auth/login.py");
    expect(text).toContain("no sign of: auth bypass");
  });

  it("shows deferred findings marked as not blocking", () => {
    const wrapper = mountPreview(PREVIEW);

    expect(wrapper.text()).toContain("unused import");
    expect(wrapper.find(".checkpoint-preview__deferred").exists()).toBe(true);
  });

  it("never claims a verdict — it is a reading guide, not a judge", () => {
    const wrapper = mountPreview(PREVIEW);
    const text = wrapper.text().toLowerCase();

    expect(wrapper.find(".checkpoint-preview__verdict").exists()).toBe(false);
    expect(text).not.toContain("passed");
    expect(text).not.toContain("failed");
    expect(text).not.toMatch(/\bverdict:/);
  });

  it("omits a section that has no entries instead of rendering an empty heading", () => {
    const wrapper = mountPreview({ ...PREVIEW, deferred: [], manual_checks: [] });

    expect(wrapper.find(".checkpoint-preview__deferred").exists()).toBe(false);
    expect(wrapper.find(".checkpoint-preview__checks").exists()).toBe(false);
    expect(wrapper.find(".checkpoint-preview__concerns").exists()).toBe(true);
  });
});
