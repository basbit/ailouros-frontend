import { describe, expect, it } from "vitest";
import {
  ABSENT,
  formatCount,
  formatDuration,
  formatRate,
  formatSignedPercent,
} from "../model/format";

describe("effect formatters", () => {
  it("render an absent value as a dash, never as zero", () => {
    expect(formatCount(null)).toBe(ABSENT);
    expect(formatCount(undefined)).toBe(ABSENT);
    expect(formatRate(null)).toBe(ABSENT);
    expect(formatDuration(null)).toBe(ABSENT);
    expect(formatSignedPercent(null)).toBe(ABSENT);
  });

  it("render a measured zero as zero", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatRate(0)).toBe("0.0%");
    expect(formatDuration(0)).toBe("0s");
  });

  it("format counts, rates, improvements and durations", () => {
    expect(formatCount(1234.4)).toBe("1,234");
    expect(formatRate(0.756)).toBe("75.6%");
    expect(formatSignedPercent(18.25)).toBe("+18.3%");
    expect(formatSignedPercent(-2)).toBe("-2.0%");
    expect(formatDuration(95)).toBe("1m 35s");
    expect(formatDuration(4000)).toBe("1h 6m");
  });
});
