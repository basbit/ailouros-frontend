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

describe("skill dispatch parsing", () => {
  it("parses a populated skill_dispatch field", () => {
    const result = parseRunDiagnosticsPayload({
      task_id: "t1",
      skill_dispatch: {
        skill_id: "backend-engineering",
        reason: "keyword match",
        dispatcher: "heuristic",
        mode: "heuristic",
      },
    });
    expect(result?.skillDispatch).toEqual({
      skillId: "backend-engineering",
      reason: "keyword match",
      dispatcher: "heuristic",
      mode: "heuristic",
    });
  });

  it("returns null when skill_dispatch is absent", () => {
    const result = parseRunDiagnosticsPayload({ task_id: "t1" });
    expect(result?.skillDispatch).toBeNull();
  });

  it("returns null when skill_id is empty", () => {
    const result = parseRunDiagnosticsPayload({
      task_id: "t1",
      skill_dispatch: { skill_id: "", reason: "", dispatcher: "", mode: "" },
    });
    expect(result?.skillDispatch).toBeNull();
  });
});

describe("security rewrite parsing", () => {
  it("parses a degraded ingress rewrite with its risk and flags", () => {
    const result = parseRunDiagnosticsPayload({
      task_id: "t1",
      security_rewrite: {
        status: "degraded",
        risk_level: "high",
        flags: ["prompt_injection", "heuristic_fallback"],
      },
    });
    expect(result?.securityRewrite).toEqual({
      status: "degraded",
      riskLevel: "high",
      flags: ["prompt_injection", "heuristic_fallback"],
    });
  });

  it("keeps a successful rewrite distinct from a switched-off one", () => {
    const ok = parseRunDiagnosticsPayload({
      task_id: "t1",
      security_rewrite: { status: "ok", risk_level: "none", flags: [] },
    });
    const off = parseRunDiagnosticsPayload({
      task_id: "t1",
      security_rewrite: { status: "disabled", risk_level: "", flags: [] },
    });
    expect(ok?.securityRewrite?.status).toBe("ok");
    expect(off?.securityRewrite?.status).toBe("disabled");
  });

  it("returns null when security_rewrite is absent", () => {
    expect(parseRunDiagnosticsPayload({ task_id: "t1" })?.securityRewrite).toBeNull();
  });

  it("refuses a status it cannot explain to an operator", () => {
    const result = parseRunDiagnosticsPayload({
      task_id: "t1",
      security_rewrite: { status: "probably-fine", risk_level: "low", flags: [] },
    });
    expect(result?.securityRewrite).toBeNull();
  });

  it("drops blank flags instead of rendering empty pills", () => {
    const result = parseRunDiagnosticsPayload({
      task_id: "t1",
      security_rewrite: {
        status: "degraded",
        risk_level: "medium",
        flags: ["heuristic_fallback", "  ", 7],
      },
    });
    expect(result?.securityRewrite?.flags).toEqual(["heuristic_fallback"]);
  });
});

describe("workspace isolation parsing", () => {
  it("parses a populated workspace_isolation field", () => {
    const result = parseRunDiagnosticsPayload({
      task_id: "t1",
      workspace_isolation: { mode: "worktree", branch: "swarm/t1" },
    });
    expect(result?.workspaceIsolation).toEqual({
      mode: "worktree",
      branch: "swarm/t1",
    });
  });

  it("returns null when workspace_isolation is absent", () => {
    const result = parseRunDiagnosticsPayload({ task_id: "t1" });
    expect(result?.workspaceIsolation).toBeNull();
  });
});
