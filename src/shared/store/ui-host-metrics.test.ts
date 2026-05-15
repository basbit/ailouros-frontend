import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useUiStore, HOST_METRICS_HISTORY_MAX } from "@/shared/store/ui";

describe("ui store — host metrics history", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("captures cpu / mem / gpu and uses provided timestamp", () => {
    const ui = useUiStore();
    ui.pushHostMetricsSample({
      cpu_percent: 42.7,
      memory_percent: 33,
      gpu_percent: 88.1,
      timestamp_ms: 1_700_000_000_000,
    });
    expect(ui.hostMetricsHistory).toHaveLength(1);
    expect(ui.hostMetricsHistory[0]).toEqual({
      t: 1_700_000_000_000,
      cpu: 42.7,
      mem: 33,
      gpu: 88.1,
    });
  });

  it("stores null for missing or non-finite fields so the chart can break the line", () => {
    const ui = useUiStore();
    ui.pushHostMetricsSample({
      cpu_percent: 12,
      timestamp_ms: 10,
      // no memory_percent, no gpu_percent
    });
    ui.pushHostMetricsSample({
      cpu_percent: Number.NaN,
      memory_percent: 50,
      gpu_percent: Infinity,
      timestamp_ms: 20,
    });
    const [a, b] = ui.hostMetricsHistory;
    expect(a).toEqual({ t: 10, cpu: 12, mem: null, gpu: null });
    expect(b).toEqual({ t: 20, cpu: null, mem: 50, gpu: null });
  });

  it("deduplicates consecutive ticks with the same timestamp", () => {
    const ui = useUiStore();
    ui.pushHostMetricsSample({ cpu_percent: 10, timestamp_ms: 1 });
    ui.pushHostMetricsSample({ cpu_percent: 99, timestamp_ms: 1 });
    expect(ui.hostMetricsHistory).toHaveLength(1);
    expect(ui.hostMetricsHistory[0].cpu).toBe(10);
  });

  it("caps the ring buffer at HOST_METRICS_HISTORY_MAX", () => {
    const ui = useUiStore();
    for (let i = 0; i < HOST_METRICS_HISTORY_MAX + 5; i += 1) {
      ui.pushHostMetricsSample({ cpu_percent: i, timestamp_ms: i });
    }
    expect(ui.hostMetricsHistory).toHaveLength(HOST_METRICS_HISTORY_MAX);
    // Oldest samples are evicted, newest is preserved.
    expect(ui.hostMetricsHistory[0].t).toBe(5);
    expect(ui.hostMetricsHistory.at(-1)?.t).toBe(HOST_METRICS_HISTORY_MAX + 4);
  });

  it("clearHostMetricsHistory drops accumulated samples", () => {
    const ui = useUiStore();
    ui.pushHostMetricsSample({ cpu_percent: 10, timestamp_ms: 1 });
    ui.pushHostMetricsSample({ cpu_percent: 20, timestamp_ms: 2 });
    ui.clearHostMetricsHistory();
    expect(ui.hostMetricsHistory).toEqual([]);
  });

  it("ignores null payloads (defensive against tick handler races)", () => {
    const ui = useUiStore();
    ui.pushHostMetricsSample(null);
    expect(ui.hostMetricsHistory).toEqual([]);
  });
});
