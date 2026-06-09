import { describe, expect, it } from "vitest";

import { parseSkillDispatchPayload } from "./skill-dispatch-types";

describe("parseSkillDispatchPayload", () => {
  it("returns null when skill_id is missing", () => {
    expect(parseSkillDispatchPayload({})).toBeNull();
    expect(parseSkillDispatchPayload({ skill_id: "" })).toBeNull();
  });

  it("returns null when payload is not an object", () => {
    expect(parseSkillDispatchPayload(null)).toBeNull();
    expect(parseSkillDispatchPayload(42)).toBeNull();
  });

  it("parses a full decision payload", () => {
    const parsed = parseSkillDispatchPayload({
      skill_id: "frontend-design",
      reason: "matched vue/component keywords",
      dispatcher: "heuristic",
      mode: "heuristic",
      candidates: ["frontend-design", "backend-engineering", "generalist"],
    });
    expect(parsed?.skillId).toBe("frontend-design");
    expect(parsed?.mode).toBe("heuristic");
    expect(parsed?.candidates).toEqual([
      "frontend-design",
      "backend-engineering",
      "generalist",
    ]);
  });

  it("defaults unknown mode to off", () => {
    const parsed = parseSkillDispatchPayload({
      skill_id: "x",
      mode: "exotic",
    });
    expect(parsed?.mode).toBe("off");
  });

  it("drops non-string candidates", () => {
    const parsed = parseSkillDispatchPayload({
      skill_id: "x",
      candidates: ["ok", 1, null, "another"],
    });
    expect(parsed?.candidates).toEqual(["ok", "another"]);
  });
});
