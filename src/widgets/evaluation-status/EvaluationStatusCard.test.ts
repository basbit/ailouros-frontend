import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

import type { EvaluationStatus } from "@/shared/model/evaluation-status-types";
import EvaluationStatusCard from "./EvaluationStatusCard.vue";
import { resetEvaluationStatus } from "@/features/evaluation-status/useEvaluationStatus";

const fetchMock = vi.fn<() => Promise<EvaluationStatus>>();

vi.mock("@/shared/api/endpoints/evaluation-status", () => ({
  getEvaluationStatus: () => fetchMock(),
}));

function makeStatus(overrides: Partial<EvaluationStatus> = {}): EvaluationStatus {
  return {
    ragas: { enabled: false, judgeKind: "heuristic" },
    telemetry: {
      enabled: false,
      exporterKind: "noop",
      readiness: { exporting: false, reason: "" },
    },
    entailment: {
      enabled: false,
      judgeKind: "heuristic",
      threshold: 0,
    },
    ...overrides,
  };
}

async function mountCard(status: EvaluationStatus) {
  resetEvaluationStatus();
  fetchMock.mockResolvedValue(status);
  const wrapper = mount(EvaluationStatusCard);
  await flushPromises();
  return wrapper;
}

describe("EvaluationStatusCard", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("renders the telemetry readiness reason with the card's own hint class", async () => {
    const wrapper = await mountCard(
      makeStatus({
        telemetry: {
          enabled: true,
          exporterKind: "otel",
          readiness: { exporting: false, reason: "SWARM_OTEL_ENABLED is not set" },
        },
      }),
    );
    const hint = wrapper.find(".eval-status__hint");
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toBe("SWARM_OTEL_ENABLED is not set");
    // The class this reason used to render with belongs to MemoryPanel.vue's
    // own scoped styles and can never apply here — it must never come back.
    expect(wrapper.find(".memory-panel-hint").exists()).toBe(false);
  });

  it("hides the readiness reason row once telemetry is exporting", async () => {
    const wrapper = await mountCard(
      makeStatus({
        telemetry: {
          enabled: true,
          exporterKind: "otel",
          readiness: { exporting: true, reason: "" },
        },
      }),
    );
    expect(wrapper.find(".eval-status__hint").exists()).toBe(false);
  });
});
