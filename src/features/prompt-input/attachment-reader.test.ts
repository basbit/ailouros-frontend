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
