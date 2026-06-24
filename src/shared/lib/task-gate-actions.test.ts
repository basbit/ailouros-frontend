import { describe, expect, it, vi, beforeEach } from "vitest";

const notifySpy = vi.fn();

vi.mock("@/shared/store/ux", () => ({
  useUxStore: () => ({ notify: notifySpy }),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const postConfirmShell = vi.fn();
const postConfirmManualShell = vi.fn();
const postConfirmHuman = vi.fn();
const postHumanResumeStream = vi.fn();
const postRetryStream = vi.fn();
const getPendingHuman = vi.fn();
const getPendingManualShell = vi.fn();
const getPendingShell = vi.fn();

vi.mock("@/shared/api/endpoints/task-gates", () => ({
  postConfirmShell: (...args: unknown[]) => postConfirmShell(...args),
  postConfirmManualShell: (...args: unknown[]) => postConfirmManualShell(...args),
  postConfirmHuman: (...args: unknown[]) => postConfirmHuman(...args),
  postHumanResumeStream: (...args: unknown[]) => postHumanResumeStream(...args),
  postRetryStream: (...args: unknown[]) => postRetryStream(...args),
  getPendingHuman: (...args: unknown[]) => getPendingHuman(...args),
  getPendingManualShell: (...args: unknown[]) => getPendingManualShell(...args),
  getPendingShell: (...args: unknown[]) => getPendingShell(...args),
}));

const getTaskPipelinePlan = vi.fn();
vi.mock("@/shared/api/endpoints/pipeline", () => ({
  getTaskPipelinePlan: (...args: unknown[]) => getTaskPipelinePlan(...args),
}));

import {
  confirmShell,
  confirmManualShell,
  confirmHuman,
  submitHumanResume,
} from "@/shared/lib/task-gate-actions";

describe("task-gate-actions transport/notification decoupling", () => {
  beforeEach(() => {
    notifySpy.mockReset();
    postConfirmShell.mockReset();
    postConfirmManualShell.mockReset();
    postConfirmHuman.mockReset();
    postHumanResumeStream.mockReset();
    postRetryStream.mockReset();
    getTaskPipelinePlan.mockReset();
  });

  it("confirmShell returns an error result and does NOT notify on failure", async () => {
    postConfirmShell.mockRejectedValueOnce(new Error("boom"));
    const result = await confirmShell("task-1", true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("boom");
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("confirmShell returns ok on success", async () => {
    postConfirmShell.mockResolvedValueOnce(undefined);
    const result = await confirmShell("task-1", true);
    expect(result.ok).toBe(true);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("confirmManualShell returns an error result and does NOT notify on failure", async () => {
    postConfirmManualShell.mockRejectedValueOnce(new Error("kaboom"));
    const result = await confirmManualShell("task-1", true);
    expect(result.ok).toBe(false);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("confirmHuman returns an error result and does NOT notify on failure", async () => {
    postConfirmHuman.mockRejectedValueOnce(new Error("nope"));
    const result = await confirmHuman("task-1", true, "feedback");
    expect(result.ok).toBe(false);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("submitHumanResume returns error result for missing taskId without notifying", async () => {
    const result = await submitHumanResume("", "fb", () => undefined);
    expect(result.ok).toBe(false);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("submitHumanResume surfaces non-ok HTTP as an error result without notifying", async () => {
    postHumanResumeStream.mockResolvedValueOnce({ ok: false, status: 500, body: null });
    const result = await submitHumanResume("task-1", "fb", () => undefined);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("500");
    expect(notifySpy).not.toHaveBeenCalled();
  });
});
