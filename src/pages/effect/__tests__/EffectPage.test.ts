import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import EffectPage from "../EffectPage.vue";
import type { EffectQuery, EffectReport } from "@/shared/api/endpoints/effect-metrics";
import {
  makeReport,
  makeUnmeasuredReport,
} from "@/features/effect-metrics/__tests__/fixtures";

const getMock = vi.fn<(query: EffectQuery) => Promise<EffectReport>>();

vi.mock("@/shared/api/endpoints/effect-metrics", () => ({
  getEffectMetrics: (query: EffectQuery) => getMock(query),
}));

vi.mock("@/app/providers/settingsContext", () => ({
  useInjectedAppSettings: () => ({ form: { workspace_root: "/work/project" } }),
}));

async function mountPage(template = "<RouterView />") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/effect", component: EffectPage },
      { path: "/autoresearch/:sessionId", component: { template: "<div />" } },
    ],
  });
  await router.push("/effect");
  await router.isReady();
  const wrapper = mount(
    { template },
    { global: { plugins: [router], stubs: { AppHeaderContainer: true } } },
  );
  await flushPromises();
  return wrapper;
}

describe("EffectPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-16T12:00:00Z"));
    getMock.mockReset().mockResolvedValue(makeReport());
  });

  it("loads the last 7 days and shows measured figures, wins and pull requests", async () => {
    const wrapper = await mountPage();

    expect(getMock).toHaveBeenCalledWith({
      from: "2026-09-10",
      to: "2026-09-16",
      workspaceRoot: "",
    });
    expect(wrapper.get('[data-testid="tile-success"]').text()).toContain("50.0%");
    expect(wrapper.get('[data-testid="tile-lines"]').text()).toContain("+120 / −7");
    expect(wrapper.get('[data-testid="tile-duration"]').text()).toContain("1m 35s");
    expect(wrapper.get('[data-testid="wins-table"]').text()).toContain("faster parser");
    expect(wrapper.get('[data-testid="wins-table"]').text()).not.toContain(
      "smaller bundle",
    );
    expect(wrapper.get('[data-testid="pulls-table"]').text()).toContain(
      "https://example.test/pr/1",
    );
    expect(wrapper.get('[data-testid="triggers"]').text()).toContain("UI: 2");
  });

  it("shows a dash, not zero, for every value no run recorded", async () => {
    getMock.mockResolvedValue(makeUnmeasuredReport());
    const wrapper = await mountPage();

    for (const key of ["files", "lines", "tokens", "duration", "success", "feedback"]) {
      const value = wrapper
        .get(`[data-testid="tile-${key}"] .effect-tile__value`)
        .text();
      expect(value, key).toBe("—");
    }
    expect(wrapper.get('[data-testid="tile-feedback"]').text()).toContain(
      "qdrant down",
    );
  });

  it("shows a dash with the reason, not zero, when a pull-request source is unreadable", async () => {
    const report = makeReport();
    getMock.mockResolvedValue({
      ...report,
      pull_requests: { ...report.pull_requests, total: null },
      source_errors: { issue_autorun: "corrupt event log" },
    });
    const wrapper = await mountPage();

    const value = wrapper.get('[data-testid="tile-pulls"] .effect-tile__value');
    expect(value.text()).toBe("—");
    expect(value.attributes("title")).toContain("corrupt event log");
    const detail = wrapper
      .get('[data-testid="tile-pulls"] .effect-tile__detail')
      .text();
    expect(detail).toContain("1 autoresearch");
    expect(detail).toContain("— issue autorun");
  });

  it("explains an unavailable source in the tile tooltip", async () => {
    getMock.mockResolvedValue(makeUnmeasuredReport());
    const wrapper = await mountPage();

    expect(
      wrapper
        .get('[data-testid="tile-feedback"] .effect-tile__value')
        .attributes("title"),
    ).toContain("qdrant down");
  });

  it("reloads for 30 days and for the current project only", async () => {
    const wrapper = await mountPage();

    await wrapper.get('[data-testid="preset-30"]').trigger("click");
    await flushPromises();
    expect(getMock).toHaveBeenLastCalledWith({
      from: "2026-08-18",
      to: "2026-09-16",
      workspaceRoot: "",
    });

    await wrapper.get('[name="projectOnly"]').setValue(true);
    await flushPromises();
    expect(getMock).toHaveBeenLastCalledWith({
      from: "2026-08-18",
      to: "2026-09-16",
      workspaceRoot: "/work/project",
    });
  });

  it("sends a custom period on apply", async () => {
    const wrapper = await mountPage();

    await wrapper.get('[name="from"]').setValue("2026-09-01");
    await wrapper.get('[name="to"]').setValue("2026-09-05");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(getMock).toHaveBeenLastCalledWith({
      from: "2026-09-01",
      to: "2026-09-05",
      workspaceRoot: "",
    });
  });

  it("loads once when mounted inside keep-alive, and again on each later activation", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/effect", component: EffectPage },
        { path: "/other", component: { template: "<div />" } },
      ],
    });
    await router.push("/effect");
    await router.isReady();
    mount(
      {
        template:
          '<RouterView v-slot="{ Component }"><KeepAlive><component :is="Component" /></KeepAlive></RouterView>',
      },
      { global: { plugins: [router], stubs: { AppHeaderContainer: true } } },
    );
    await flushPromises();
    expect(getMock).toHaveBeenCalledTimes(1);

    await router.push("/other");
    await router.push("/effect");
    await flushPromises();
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("ignores a stale response that lands after a newer period was chosen", async () => {
    const pending: Array<(report: EffectReport) => void> = [];
    getMock.mockImplementation(
      () => new Promise<EffectReport>((resolve) => pending.push(resolve)),
    );
    const wrapper = await mountPage();
    await wrapper.get('[data-testid="preset-30"]').trigger("click");
    await flushPromises();
    expect(pending).toHaveLength(2);

    pending[1](makeReport({ first_day: "2026-08-18", unreadable_runs: 30 }));
    await flushPromises();
    pending[0](makeReport({ unreadable_runs: 7 }));
    await flushPromises();

    expect(wrapper.get('[data-testid="unreadable"]').text()).toContain("30");
    expect(wrapper.find('[data-testid="preset-30"]').classes()).toContain(
      "effect-page__preset--active",
    );
  });

  it("shows why the metrics could not be loaded", async () => {
    getMock.mockRejectedValue(new Error("period is reversed"));
    const wrapper = await mountPage();

    expect(wrapper.get('[role="alert"]').text()).toContain("period is reversed");
  });
});
