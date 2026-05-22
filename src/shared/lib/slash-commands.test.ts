import { describe, expect, it } from "vitest";
import { SLASH_COMMANDS, tryParseGoalCommand } from "./slash-commands";

describe("slash-commands registry", () => {
  it("exposes the /goal command", () => {
    const keys = SLASH_COMMANDS.map((entry) => entry.trigger);
    expect(keys).toContain("/goal");
  });

  it("documents the /goal command with a description", () => {
    const goal = SLASH_COMMANDS.find((entry) => entry.key === "goal");
    expect(goal).toBeDefined();
    expect(goal?.description.length).toBeGreaterThan(10);
  });
});

describe("tryParseGoalCommand — invalid inputs", () => {
  it("returns null for empty input", () => {
    expect(tryParseGoalCommand("")).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(tryParseGoalCommand("   \n\t  ")).toBeNull();
  });

  it("returns null for non-goal commands", () => {
    expect(tryParseGoalCommand("regular task description")).toBeNull();
    expect(tryParseGoalCommand("/other thing")).toBeNull();
  });

  it("returns null when /goal has no title", () => {
    expect(tryParseGoalCommand("/goal")).toBeNull();
    expect(tryParseGoalCommand("/goal   ")).toBeNull();
  });

  it("takes the first line literally as title even if it looks like a bullet", () => {
    const parsed = tryParseGoalCommand("/goal\n- bullet only");
    expect(parsed?.title).toBe("- bullet only");
    expect(parsed?.successCriteria).toEqual([]);
  });
});

describe("tryParseGoalCommand — title-only inputs", () => {
  it("parses title-only goal", () => {
    const parsed = tryParseGoalCommand("/goal Reach zero mypy errors");
    expect(parsed).toEqual({
      kind: "goal",
      title: "Reach zero mypy errors",
      successCriteria: [],
      description: "",
      schedule: null,
    });
  });

  it("trims surrounding whitespace before parsing", () => {
    const parsed = tryParseGoalCommand("   /goal   Title here   ");
    expect(parsed?.title).toBe("Title here");
  });
});

describe("tryParseGoalCommand — success criteria", () => {
  it("collects success criteria from bullet lines (dash prefix)", () => {
    const parsed = tryParseGoalCommand(
      "/goal Improve coverage\n- backend coverage >= 90%\n- frontend coverage >= 80%",
    );
    expect(parsed?.successCriteria).toEqual([
      "backend coverage >= 90%",
      "frontend coverage >= 80%",
    ]);
  });

  it("collects success criteria with asterisk prefix", () => {
    const parsed = tryParseGoalCommand("/goal X\n* a\n* b");
    expect(parsed?.successCriteria).toEqual(["a", "b"]);
  });

  it("includes plain lines (no bullet) as criteria too", () => {
    const parsed = tryParseGoalCommand("/goal X\nfirst step\nsecond step");
    expect(parsed?.successCriteria).toEqual(["first step", "second step"]);
  });

  it("skips empty lines between criteria", () => {
    const parsed = tryParseGoalCommand("/goal X\n- a\n\n\n- b");
    expect(parsed?.successCriteria).toEqual(["a", "b"]);
  });

  it("drops empty bullet lines that have no content after the marker", () => {
    const parsed = tryParseGoalCommand("/goal X\n- \n- real one");
    expect(parsed?.successCriteria).toEqual(["real one"]);
  });
});

describe("tryParseGoalCommand — description", () => {
  it("parses description after 'description:' keyword on same line", () => {
    const parsed = tryParseGoalCommand(
      "/goal Stabilise\n- make ci exit 0\ndescription: Keep CI green",
    );
    expect(parsed?.description).toBe("Keep CI green");
  });

  it("appends subsequent lines to description after description: keyword", () => {
    const parsed = tryParseGoalCommand(
      "/goal Stabilise\n- make ci exit 0\ndescription: Keep CI green for two weeks\nnext sprint focus",
    );
    expect(parsed?.successCriteria).toEqual(["make ci exit 0"]);
    expect(parsed?.description).toBe("Keep CI green for two weeks\nnext sprint focus");
  });

  it("treats 'DESCRIPTION:' case-insensitively", () => {
    const parsed = tryParseGoalCommand("/goal Title\nDESCRIPTION: case-insensitive");
    expect(parsed?.description).toBe("case-insensitive");
  });

  it("empty description token still flips the mode", () => {
    const parsed = tryParseGoalCommand(
      "/goal Title\n- crit\ndescription:\nthis is body",
    );
    expect(parsed?.description).toBe("this is body");
    expect(parsed?.successCriteria).toEqual(["crit"]);
  });
});

describe("tryParseGoalCommand — schedule", () => {
  it("parses cron schedule with five fields", () => {
    const parsed = tryParseGoalCommand(
      "/goal Weekly digest\n- summary published\nschedule: cron 0 9 * * MON",
    );
    expect(parsed?.schedule).toEqual({ mode: "cron", cron: "0 9 * * MON" });
  });

  it("recognises 'CRON' case-insensitively", () => {
    const parsed = tryParseGoalCommand("/goal X\nschedule: CRON */5 * * * *");
    expect(parsed?.schedule).toEqual({ mode: "cron", cron: "*/5 * * * *" });
  });

  it("rejects cron with fewer than 5 fields", () => {
    const parsed = tryParseGoalCommand("/goal X\nschedule: cron 0 9");
    expect(parsed?.schedule).toBeNull();
  });

  it("rejects cron with more than 5 fields", () => {
    const parsed = tryParseGoalCommand("/goal X\nschedule: cron 0 9 * * MON extra");
    expect(parsed?.schedule).toBeNull();
  });

  it("treats non-cron schedule lines as natural language", () => {
    const parsed = tryParseGoalCommand(
      "/goal Daily digest\nschedule: каждый день в 9 утра",
    );
    expect(parsed?.schedule).toEqual({
      mode: "natural",
      naturalLanguage: "каждый день в 9 утра",
    });
  });

  it("returns null schedule when line is blank after 'schedule:'", () => {
    const parsed = tryParseGoalCommand("/goal X\nschedule:");
    expect(parsed?.schedule).toBeNull();
  });

  it("schedule keyword does not pollute success criteria or description", () => {
    const parsed = tryParseGoalCommand(
      "/goal X\n- criterion\nschedule: cron 0 0 * * *\ndescription: body",
    );
    expect(parsed?.successCriteria).toEqual(["criterion"]);
    expect(parsed?.description).toBe("body");
    expect(parsed?.schedule).toEqual({ mode: "cron", cron: "0 0 * * *" });
  });
});

describe("tryParseGoalCommand — line endings", () => {
  it("accepts CRLF line endings", () => {
    const parsed = tryParseGoalCommand("/goal Title\r\n- a\r\n- b");
    expect(parsed?.successCriteria).toEqual(["a", "b"]);
  });
});
