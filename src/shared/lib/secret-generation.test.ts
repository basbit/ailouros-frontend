import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSecretHex } from "./secret-generation";

describe("generateSecretHex", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("draws 32 bytes from the CSPRNG and hex-encodes them", () => {
    const spy = vi.spyOn(crypto, "getRandomValues");
    const secret = generateSecretHex();
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as Uint8Array).length).toBe(32);
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it("encodes every byte as two digits, low bytes included", () => {
    vi.spyOn(crypto, "getRandomValues").mockImplementation(<T extends ArrayBufferView | null>(array: T): T => {
      const bytes = array as unknown as Uint8Array;
      bytes.set([0, 1, 15, 16, 255]);
      return array;
    });
    expect(generateSecretHex(5)).toBe("00010f10ff");
  });

  it("never repeats", () => {
    expect(generateSecretHex()).not.toBe(generateSecretHex());
  });
});
