/**
 * `waitForUiPaint` gates the stream POST behind one animation frame. In a
 * hidden tab requestAnimationFrame never fires, so a run started from a
 * background tab hung at "Starting…" forever and never reached the backend.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { UI_PAINT_FALLBACK_MS, useSwarmRunState } from "./useSwarmRunState";

describe("useSwarmRunState.waitForUiPaint", () => {
  let originalRaf: typeof window.requestAnimationFrame;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    originalRaf = window.requestAnimationFrame;
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRaf;
    vi.useRealTimers();
  });

  it("resolves even when requestAnimationFrame never calls back (hidden tab)", async () => {
    window.requestAnimationFrame = () => 1;
    const { waitForUiPaint } = useSwarmRunState();
    let resolved = false;
    void waitForUiPaint().then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(UI_PAINT_FALLBACK_MS);

    expect(resolved).toBe(true);
  });

  it("resolves on the frame when one arrives first", async () => {
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    };
    const { waitForUiPaint } = useSwarmRunState();
    let resolved = false;
    void waitForUiPaint().then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(0);

    expect(resolved).toBe(true);
  });
});
