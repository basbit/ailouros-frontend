import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import HostMetricsChart from "@/shared/components/HostMetricsChart.vue";
import type { HostMetricsSample } from "@/shared/store/ui";

beforeEach(() => {
  // The chart calls useI18n() which reads usePreferencesStore() → needs Pinia.
  localStorage.setItem("ailouros.locale", "en");
  setActivePinia(createPinia());
});

function sample(
  partial: Partial<HostMetricsSample> & { t: number },
): HostMetricsSample {
  return { cpu: null, mem: null, gpu: null, ...partial };
}

describe("HostMetricsChart", () => {
  it("shows a 'collecting' placeholder when there is less than two samples", () => {
    const wrapper = mount(HostMetricsChart, { props: { samples: [] } });
    expect(wrapper.find("svg").exists()).toBe(false);
    expect(wrapper.text()).toContain("Collecting samples");
  });

  it("renders CPU and RAM paths and hides GPU when no sample carries gpu data", () => {
    const samples: HostMetricsSample[] = [
      sample({ t: 0, cpu: 10, mem: 20 }),
      sample({ t: 1000, cpu: 30, mem: 40 }),
      sample({ t: 2000, cpu: 50, mem: 60 }),
    ];
    const wrapper = mount(HostMetricsChart, { props: { samples } });
    expect(wrapper.find(".host-chart__line--cpu").exists()).toBe(true);
    expect(wrapper.find(".host-chart__line--mem").exists()).toBe(true);
    expect(wrapper.find(".host-chart__line--gpu").exists()).toBe(false);
    // GPU legend is also hidden when no GPU data ever arrived.
    expect(wrapper.find(".host-chart__legend-item--gpu").exists()).toBe(false);
  });

  it("draws the GPU line and labels it with the discovered card name", () => {
    const samples: HostMetricsSample[] = [
      sample({ t: 0, cpu: 1, mem: 2, gpu: 80 }),
      sample({ t: 1000, cpu: 3, mem: 4, gpu: 75 }),
    ];
    const wrapper = mount(HostMetricsChart, {
      props: { samples, gpuName: "RTX 4090" },
    });
    expect(wrapper.find(".host-chart__line--gpu").exists()).toBe(true);
    expect(wrapper.text()).toContain("GPU · RTX 4090");
  });

  it("breaks the line on null samples instead of stitching across them", () => {
    // Two valid runs separated by a missing reading: a path with one
    // continuous run and the second resumed via a new M segment.
    const samples: HostMetricsSample[] = [
      sample({ t: 0, cpu: 10 }),
      sample({ t: 1000, cpu: 20 }),
      sample({ t: 2000, cpu: null }), // collector hiccup
      sample({ t: 3000, cpu: 40 }),
      sample({ t: 4000, cpu: 50 }),
    ];
    const wrapper = mount(HostMetricsChart, { props: { samples } });
    const d = wrapper.find(".host-chart__line--cpu").attributes("d") ?? "";
    // Two separate sub-paths → two 'M' commands, never bridged across the gap.
    const moves = d.match(/M/g) ?? [];
    expect(moves.length).toBe(2);
  });

  it("clamps values above 100% so a momentary spike doesn't escape the viewbox", () => {
    const samples: HostMetricsSample[] = [
      sample({ t: 0, cpu: 0 }),
      sample({ t: 1000, cpu: 500 }), // misbehaved sensor
    ];
    const wrapper = mount(HostMetricsChart, {
      props: { samples, width: 100, height: 50 },
    });
    const d = wrapper.find(".host-chart__line--cpu").attributes("d") ?? "";
    // Highest displayable point sits at y=0 (top of the chart), never above.
    const yCoords = Array.from(d.matchAll(/[ML]([\d.]+),([\d.]+)/g)).map((m) =>
      parseFloat(m[2]),
    );
    expect(Math.min(...yCoords)).toBeGreaterThanOrEqual(0);
  });

  it("shows the most recent reading in the legend", () => {
    const samples: HostMetricsSample[] = [
      sample({ t: 0, cpu: 10, mem: 20 }),
      sample({ t: 1000, cpu: 75, mem: 40 }),
    ];
    const wrapper = mount(HostMetricsChart, { props: { samples } });
    expect(wrapper.text()).toContain("75%");
    expect(wrapper.text()).toContain("40%");
  });
});
