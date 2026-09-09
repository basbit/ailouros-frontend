import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUiStore } from "@/shared/store/ui";
import { useAttentionAlert, playAttentionChime } from "./useAttentionAlert";

vi.mock("@/shared/lib/desktop-bridge", () => ({
  isDesktop: vi.fn().mockReturnValue(false),
}));

vi.mock("@/shared/lib/useDesktopNotifications", () => ({
  sendDesktopNotification: vi.fn().mockResolvedValue(true),
}));

describe("useAttentionAlert", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.title = "Agent Swarm";
  });

  it("is false when no gates or human approval states are active", () => {
    const alert = useAttentionAlert();
    expect(alert.isAttentionRequired.value).toBe(false);
    expect(alert.attentionReason.value).toBeNull();
  });

  it("becomes true when humanGateVisible is set", () => {
    const ui = useUiStore();
    const alert = useAttentionAlert();

    ui.humanGateVisible = true;
    ui.humanGateTitle = "Approve Architecture";

    expect(alert.isAttentionRequired.value).toBe(true);
    expect(alert.attentionReason.value).toBe("Approve Architecture");
  });

  it("becomes true when shellGateVisible is set", () => {
    const ui = useUiStore();
    const alert = useAttentionAlert();

    ui.shellGateVisible = true;
    expect(alert.isAttentionRequired.value).toBe(true);
    expect(alert.attentionReason.value).toBe("Shell command approval required");
  });

  it("becomes true when taskStatus is awaiting_human", () => {
    const ui = useUiStore();
    const alert = useAttentionAlert();

    ui.taskStatus = "awaiting_human";
    expect(alert.isAttentionRequired.value).toBe(true);
    expect(alert.attentionReason.value).toBe("Pipeline awaiting human review");
  });

  it("updates document.title on trigger and restores on clear", () => {
    const alert = useAttentionAlert();
    alert.handleAttentionTriggered("Approval needed");
    expect(document.title).toContain("(⚠️ Attention)");

    alert.handleAttentionCleared();
    expect(document.title).not.toContain("(⚠️ Attention)");
  });

  it("playAttentionChime does not throw even if Web Audio is mocked or missing", () => {
    expect(() => playAttentionChime()).not.toThrow();
  });
});
