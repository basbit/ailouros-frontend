import { describe, expect, it } from "vitest";

import { parseCheckpointPreview } from "./checkpoint-preview-types";

const RAW = {
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

describe("parseCheckpointPreview", () => {
  it("reads the whole reading guide", () => {
    const preview = parseCheckpointPreview(RAW);

    expect(preview).not.toBeNull();
    expect(preview?.stepId).toBe("human_qa");
    expect(preview?.concerns).toEqual([
      { path: "app/auth/login.py", tags: ["auth", "security"] },
    ]);
    expect(preview?.riskHotspots[0]).toEqual({
      what: "auth bypass on empty token",
      where: ["app/auth/login.py"],
      tags: ["auth"],
      severity: "P0",
    });
    expect(preview?.manualChecks).toEqual([
      { do: "exercise app/auth/login.py", expect: "no sign of: auth bypass" },
    ]);
    expect(preview?.deferred).toEqual([
      { title: "unused import", stepId: "review_dev" },
    ]);
  });

  it("returns null when there is no preview at all", () => {
    expect(parseCheckpointPreview(null)).toBeNull();
    expect(parseCheckpointPreview(undefined)).toBeNull();
    expect(parseCheckpointPreview("not an object")).toBeNull();
  });

  it("returns null when every section is empty, so nothing renders an empty card", () => {
    expect(
      parseCheckpointPreview({
        step_id: "human_qa",
        concerns: [],
        risk_hotspots: [],
        manual_checks: [],
        deferred: [],
      }),
    ).toBeNull();
  });

  it("survives missing and malformed sections rather than throwing", () => {
    const preview = parseCheckpointPreview({
      step_id: 42,
      concerns: "nope",
      risk_hotspots: [{ what: "something" }],
    });

    expect(preview?.stepId).toBe("");
    expect(preview?.concerns).toEqual([]);
    expect(preview?.riskHotspots).toEqual([
      { what: "something", where: [], tags: [], severity: "" },
    ]);
    expect(preview?.manualChecks).toEqual([]);
  });

  it("drops hotspots and checks that carry no text", () => {
    const preview = parseCheckpointPreview({
      risk_hotspots: [{ what: "" }, { what: "real one" }],
      manual_checks: [
        { do: "", expect: "" },
        { do: "look", expect: "see" },
      ],
    });

    expect(preview?.riskHotspots).toHaveLength(1);
    expect(preview?.manualChecks).toHaveLength(1);
  });
});
