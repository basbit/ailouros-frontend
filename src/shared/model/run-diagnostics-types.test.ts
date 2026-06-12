import { describe, expect, it } from "vitest";

import { parseRunDiagnosticsPayload } from "./run-diagnostics-types";

describe("parseRunDiagnosticsPayload", () => {
  it("returns null when payload missing task_id", () => {
    expect(parseRunDiagnosticsPayload({})).toBeNull();
  });

  it("parses a full payload", () => {
    const parsed = parseRunDiagnosticsPayload({
      task_id: "task-1",
      phase_loop: {
        scenario: "default",
        current_phase: "verify",
        history: [{ from: "plan", to: "execute", reason: "step:dev" }],
      },
      wiki_context_tier: { tier: "semantic", reason: "wiki" },
      entailment_verdict: { verdict: "entailment", score: 0.91, reason: "" },
      citation_enforcement: {
        dev_output: {
          mode: "soft",
          accepted: true,
          coverage_score: 0.75,
          cited_claims: 3,
          total_claims: 4,
          violations: 1,
        },
      },
    });
    expect(parsed?.phaseLoop?.currentPhase).toBe("verify");
    expect(parsed?.phaseLoop?.history).toHaveLength(1);
    expect(parsed?.wikiContextTier?.tier).toBe("semantic");
    expect(parsed?.entailmentVerdict?.score).toBe(0.91);
    expect(parsed?.citation?.nodes[0]?.data.violations).toBe(1);
  });

  it("returns nulls when sub-blocks invalid", () => {
    const parsed = parseRunDiagnosticsPayload({
      task_id: "t",
      phase_loop: { scenario: "", current_phase: "" },
      wiki_context_tier: { tier: "" },
      entailment_verdict: { verdict: "" },
      citation_enforcement: {},
    });
    expect(parsed?.phaseLoop).toBeNull();
    expect(parsed?.wikiContextTier).toBeNull();
    expect(parsed?.entailmentVerdict).toBeNull();
    expect(parsed?.citation).toBeNull();
  });

  it("drops history entries with missing from/to", () => {
    const parsed = parseRunDiagnosticsPayload({
      task_id: "t",
      phase_loop: {
        scenario: "x",
        current_phase: "y",
        history: [
          { from: "", to: "y", reason: "noise" },
          { from: "a", to: "b", reason: "good" },
        ],
      },
    });
    expect(parsed?.phaseLoop?.history).toHaveLength(1);
    expect(parsed?.phaseLoop?.history[0]?.from).toBe("a");
  });

  it("parses ragas_metrics with scores", () => {
    const parsed = parseRunDiagnosticsPayload({
      task_id: "t",
      ragas_metrics: {
        faithfulness: { score: 0.85, reason: "strong overlap" },
        answer_relevancy: { score: 0.72, reason: "" },
      },
    });
    expect(parsed?.ragasMetrics?.scores.faithfulness?.score).toBe(0.85);
    expect(parsed?.ragasMetrics?.scores.answer_relevancy?.score).toBe(0.72);
  });

  it("returns null ragas_metrics when empty object", () => {
    const parsed = parseRunDiagnosticsPayload({
      task_id: "t",
      ragas_metrics: {},
    });
    expect(parsed?.ragasMetrics).toBeNull();
  });

  it("parses enable_hints as plain string map", () => {
    const parsed = parseRunDiagnosticsPayload({
      task_id: "t",
      enable_hints: { phase_loop: "set SWARM_FOO=1", wiki_tier: "set BAR" },
    });
    expect(parsed?.enableHints["phase_loop"]).toContain("SWARM_FOO");
    expect(Object.keys(parsed?.enableHints ?? {}).length).toBe(2);
  });
});
