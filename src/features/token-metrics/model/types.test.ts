import { describe, expect, it } from "vitest";

import { parseTokenMetricsPayload } from "./types";

describe("parseTokenMetricsPayload", () => {
  it("reports nothing when the task carries no metrics yet", () => {
    const parsed = parseTokenMetricsPayload({ task_id: "t-1", status: "in_progress" });

    expect(parsed).toBeNull();
  });

  it("reports a genuine zero as data, because measured zero is not missing", () => {
    const parsed = parseTokenMetricsPayload({
      task_id: "t-1",
      pipeline_metrics: { total_input_tokens: 0, file_read_cache_hits: 0 },
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.totalInputTokens).toBe(0);
  });

  it("reads the metrics a running task reports", () => {
    const parsed = parseTokenMetricsPayload({
      task_id: "t-1",
      pipeline_metrics: {
        total_input_tokens: 15925,
        median_small_step_input_tokens: 1291,
        file_read_cache_hits: 3,
        file_read_cache_misses: 17,
        file_read_cache_hit_rate: 0.15,
        step_metrics: { review_pm: { input_tokens: 2685, output_tokens: 1913 } },
      },
    });

    expect(parsed?.totalInputTokens).toBe(15925);
    expect(parsed?.fileReadCacheHits).toBe(3);
    expect(parsed?.fileReadCacheMisses).toBe(17);
    expect(parsed?.fileReadCacheHitRate).toBeCloseTo(0.15);
    expect(parsed?.steps.map((s) => s.stepId)).toEqual(["review_pm"]);
  });

  it("reports nothing without a task id or payload", () => {
    expect(parseTokenMetricsPayload(null)).toBeNull();
    expect(parseTokenMetricsPayload({})).toBeNull();
    expect(
      parseTokenMetricsPayload({ pipeline_metrics: { total_input_tokens: 5 } }),
    ).toBeNull();
  });

  it("ignores a metrics field that is not an object", () => {
    expect(
      parseTokenMetricsPayload({ task_id: "t-1", pipeline_metrics: "nope" }),
    ).toBeNull();
  });
});
