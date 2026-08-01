import { describe, expect, it } from "vitest";

import { parseSpecStatus } from "./spec-status-types";

describe("parseSpecStatus", () => {
  it("reads a blocked status together with the reason", () => {
    const status = parseSpecStatus({
      status: "blocked",
      blocking_condition: "spec incomplete after retry",
    });

    expect(status).toEqual({
      status: "blocked",
      blockingCondition: "spec incomplete after retry",
      isBlocked: true,
    });
  });

  it("reads a live status with no reason", () => {
    const status = parseSpecStatus({ status: "ready-for-dev" });

    expect(status).toEqual({
      status: "ready-for-dev",
      blockingCondition: "",
      isBlocked: false,
    });
  });

  it("returns null when the record is absent or unusable", () => {
    expect(parseSpecStatus(null)).toBeNull();
    expect(parseSpecStatus({})).toBeNull();
    expect(parseSpecStatus({ status: "" })).toBeNull();
    expect(parseSpecStatus("blocked")).toBeNull();
  });

  it("rejects a status the backend state machine does not define", () => {
    expect(parseSpecStatus({ status: "whatever" })).toBeNull();
  });
});
