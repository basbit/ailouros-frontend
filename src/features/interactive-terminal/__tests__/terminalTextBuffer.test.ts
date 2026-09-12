import { describe, expect, it } from "vitest";
import { createPtyTextBuffer, stripEscapeSequences } from "../terminalTextBuffer";

const ESCAPE = "\u001b";
const BELL = "\u0007";

describe("stripEscapeSequences", () => {
  it("removes colour, reset and title sequences", () => {
    const source = `${ESCAPE}[0m${ESCAPE}[01;34msrc${ESCAPE}[0m${ESCAPE}]0;me@host${BELL}$ `;
    expect(stripEscapeSequences(source).plain).toBe("src$ ");
  });

  it("carries a sequence that was cut in half between two reads", () => {
    const first = stripEscapeSequences(`ok${ESCAPE}[01`);
    expect(first.plain).toBe("ok");
    expect(first.carry).toBe(`${ESCAPE}[01`);

    const second = stripEscapeSequences(`${first.carry};34mdone`);
    expect(second.plain).toBe("done");
    expect(second.carry).toBe("");
  });
});

describe("createPtyTextBuffer", () => {
  it("overwrites the current line on carriage return", () => {
    const buffer = createPtyTextBuffer();
    buffer.appendText("downloading 10%\rdownloading 99%");
    expect(buffer.value).toBe("downloading 99%");
  });

  it("treats CRLF as a plain newline and keeps the finished line", () => {
    const buffer = createPtyTextBuffer();
    buffer.appendText("first\r\nsecond\rthird");
    expect(buffer.value).toBe("first\nthird");
  });

  it("applies backspace within the current line", () => {
    const buffer = createPtyTextBuffer();
    buffer.appendText("abcx\b!");
    expect(buffer.value).toBe("abc!");
  });

  it("caps the buffer so an unbounded stream cannot grow forever", () => {
    const buffer = createPtyTextBuffer(64);
    for (let index = 0; index < 100; index += 1) {
      buffer.appendText(`line-${index}\n`);
    }
    expect(buffer.value.length).toBeLessThanOrEqual(64);
    expect(buffer.value.endsWith("line-99\n")).toBe(true);
  });

  it("clears back to an empty buffer", () => {
    const buffer = createPtyTextBuffer();
    buffer.appendText("noise");
    expect(buffer.clear()).toBe("");
    expect(buffer.value).toBe("");
  });

  it("joins a UTF-8 character split across two byte chunks", () => {
    const buffer = createPtyTextBuffer();
    const bytes = new TextEncoder().encode("naïve");
    buffer.appendBytes(bytes.slice(0, 3).buffer);
    buffer.appendBytes(bytes.slice(3).buffer);
    expect(buffer.value).toBe("naïve");
  });
});
