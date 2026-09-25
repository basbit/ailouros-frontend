import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import AutoresearchSessionView from "../AutoresearchSessionView.vue";
import { makeIteration, makeSession } from "./fixtures";
import type { ResearchSession } from "@/shared/api/endpoints/autoresearch";

function mountView(session: ResearchSession) {
  return mount(AutoresearchSessionView, {
    props: { session, busyAction: null, actionError: "" },
  });
}

describe("AutoresearchSessionView", () => {
  it("shows baseline, best and one row per iteration with value, delta and decision", () => {
    const wrapper = mountView(
      makeSession({
        iterations: [
          makeIteration(),
          makeIteration({
            number: 2,
            hypothesis: "unroll loop",
            decision: "reverted",
            value: 95,
            improvement_pct: -18.75,
            reference_value: 80,
            commit: "",
            reason: "not better",
          }),
        ],
      }),
    );

    expect(wrapper.get('[data-testid="baseline"]').text()).toBe("100");
    expect(wrapper.get('[data-testid="best"]').text()).toBe("80");
    const rows = wrapper.findAll('[data-testid="iteration-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain("+20.00%");
    expect(rows[1].text()).toContain("unroll loop");
    expect(rows[1].text()).toContain("-18.75%");
    expect(rows[1].text()).toContain("reverted");
  });

  it("offers only Cancel while running", () => {
    const wrapper = mountView(makeSession({ status: "running" }));

    expect(wrapper.find('[data-testid="action-cancel"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="action-pullRequest"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="action-discard"]').exists()).toBe(false);
  });

  it("offers PR, apply and discard for a finished session with kept changes", async () => {
    const wrapper = mountView(makeSession({ status: "completed" }));

    expect(wrapper.find('[data-testid="action-cancel"]').exists()).toBe(false);
    await wrapper.get('[data-testid="action-apply"]').trigger("click");
    await wrapper.get('[data-testid="action-pullRequest"]').trigger("click");

    expect(wrapper.emitted("action")).toEqual([["apply"], ["pullRequest"]]);
  });

  it("hides publishing when nothing was kept", () => {
    const wrapper = mountView(makeSession({ status: "completed", kept_count: 0 }));

    expect(wrapper.find('[data-testid="action-apply"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="action-discard"]').exists()).toBe(true);
  });

  it("shows the action error and the pull request link", () => {
    const wrapper = mount(AutoresearchSessionView, {
      props: {
        session: makeSession({
          status: "completed",
          pull_request_url: "https://example.test/pr/3",
        }),
        busyAction: null,
        actionError: "no remote branch 'origin/main'",
      },
    });

    expect(wrapper.get('[data-testid="action-error"]').text()).toContain("origin/main");
    expect(wrapper.get("a").attributes("href")).toBe("https://example.test/pr/3");
    expect(
      wrapper.get('[data-testid="action-pullRequest"]').attributes("disabled"),
    ).toBeDefined();
  });
});
