import { describe, expect, it } from "vitest";
import { lastDays } from "../model/period";

describe("lastDays", () => {
  it("ends today in UTC and includes today", () => {
    expect(lastDays(7, new Date("2026-09-24T23:30:00Z"))).toEqual({
      from: "2026-09-18",
      to: "2026-09-24",
    });
  });

  it("crosses a month boundary", () => {
    expect(lastDays(30, new Date("2026-09-24T00:10:00Z"))).toEqual({
      from: "2026-08-26",
      to: "2026-09-24",
    });
  });
});
