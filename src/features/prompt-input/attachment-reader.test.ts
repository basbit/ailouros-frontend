import { describe, expect, it } from "vitest";
import { looksBinary, readAttachments } from "./attachment-reader";

function file(name: string, bytes: Uint8Array | string): File {
  return new File([bytes as BlobPart], name);
}

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff,
]);

describe("attachment reader", () => {
  it("refuses a binary file out loud instead of sending mojibake", async () => {
    const result = await readAttachments([file("shot.png", PNG_HEADER)], []);

    expect(result.accepted).toEqual([]);
    expect(result.rejected).toEqual([{ name: "shot.png", reason: "binary" }]);
  });

  it("accepts a text file", async () => {
    const result = await readAttachments([file("notes.md", "# hello")], []);

    expect(result.accepted).toEqual([{ name: "notes.md", content: "# hello" }]);
    expect(result.rejected).toEqual([]);
  });

  it("reports a duplicate rather than dropping it silently", async () => {
    const result = await readAttachments(
      [file("a.txt", "x")],
      [{ name: "a.txt", content: "old" }],
    );

    expect(result.accepted).toEqual([]);
    expect(result.rejected[0]?.reason).toBe("duplicate");
  });

  it("does not mistake ordinary unicode prose for binary", () => {
    expect(looksBinary("\u041f\u0440\u0438\u0432\u0435\u0442 \u2014 caf\u00e9")).toBe(
      false,
    );
  });

  it("treats an embedded NUL as binary", () => {
    expect(looksBinary("ok\u0000then")).toBe(true);
  });
});

describe("per-file size limit", () => {
  it("rejects a file over the limit instead of letting the backend truncate it", async () => {
    const limit = 100;
    const big = new File(["x".repeat(limit + 1)], "big.txt", { type: "text/plain" });

    const result = await readAttachments([big], [], limit);

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected).toEqual([{ name: "big.txt", reason: "too_large" }]);
  });

  it("accepts a file exactly at the limit", async () => {
    const limit = 10;
    const exact = new File(["y".repeat(limit)], "exact.txt", { type: "text/plain" });

    const result = await readAttachments([exact], [], limit);

    expect(result.accepted.map((a) => a.name)).toEqual(["exact.txt"]);
    expect(result.rejected).toHaveLength(0);
  });

  it("applies no limit when none is supplied", async () => {
    const file = new File(["z".repeat(5000)], "unbounded.txt", { type: "text/plain" });

    const result = await readAttachments([file], []);

    expect(result.accepted.map((a) => a.name)).toEqual(["unbounded.txt"]);
  });
});
