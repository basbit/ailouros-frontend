import { describe, expect, it } from "vitest";

import { parseEvaluationStatusPayload } from "./evaluation-status-types";

describe("parseEvaluationStatusPayload", () => {
  it("returns null when payload is not an object", () => {
    expect(parseEvaluationStatusPayload(null)).toBeNull();
    expect(parseEvaluationStatusPayload("foo")).toBeNull();
  });

  it("defaults sub-blocks when they are missing", () => {
    const parsed = parseEvaluationStatusPayload({});
    expect(parsed?.ragas.enabled).toBe(false);
    expect(parsed?.ragas.modelId).toBe("");
    expect(parsed?.telemetry.enabled).toBe(false);
    expect(parsed?.telemetry.exporterKind).toBe("noop");
    expect(parsed?.entailment.enabled).toBe(false);
    expect(parsed?.entailment.judgeKind).toBe("heuristic");
    expect(parsed?.entailment.threshold).toBe(0);
  });

  it("parses a full payload", () => {
    const parsed = parseEvaluationStatusPayload({
      ragas: { enabled: true, model_id: "gpt-4o" },
      telemetry: { enabled: true, exporter_kind: "otel" },
      entailment: {
        enabled: true,
        judge_kind: "llm",
        model_id: "claude-sonnet",
        threshold: 0.75,
      },
    });
    expect(parsed?.ragas.modelId).toBe("gpt-4o");
    expect(parsed?.telemetry.exporterKind).toBe("otel");
    expect(parsed?.entailment.judgeKind).toBe("llm");
    expect(parsed?.entailment.threshold).toBe(0.75);
  });

  it("coerces non-numeric threshold to zero", () => {
    const parsed = parseEvaluationStatusPayload({
      entailment: { threshold: "high" },
    });
    expect(parsed?.entailment.threshold).toBe(0);
  });

  it("falls back to noop when exporter_kind missing", () => {
    const parsed = parseEvaluationStatusPayload({ telemetry: { enabled: true } });
    expect(parsed?.telemetry.exporterKind).toBe("noop");
  });
});
