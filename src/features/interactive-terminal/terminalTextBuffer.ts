const TERMINAL_BUFFER_MAX_CHARS = 200_000;

const ESCAPE = "\u001b";
const BELL = "\u0007";
const STRING_SEQUENCE_INTRODUCERS = new Set(["P", "X", "^", "_", "]"]);
const CHARSET_INTRODUCERS = new Set(["(", ")", "*", "+", "-", ".", "/"]);

interface EscapeScanResult {
  /** Text with every escape sequence removed. */
  plain: string;
  /** Trailing bytes of an escape sequence that this chunk cut in half. */
  carry: string;
}

function isCsiFinalByte(character: string): boolean {
  const code = character.charCodeAt(0);
  return code >= 0x40 && code <= 0x7e;
}

function scanStringSequenceEnd(source: string, start: number): number {
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === BELL) return index + 1;
    if (source[index] === ESCAPE) {
      if (index + 1 >= source.length) return -1;
      if (source[index + 1] === "\\") return index + 2;
    }
  }
  return -1;
}

function scanEscapeEnd(source: string, escapeStart: number): number {
  const introducer = source[escapeStart + 1];
  if (introducer === undefined) return -1;

  if (introducer === "[") {
    for (let index = escapeStart + 2; index < source.length; index += 1) {
      if (isCsiFinalByte(source[index])) return index + 1;
    }
    return -1;
  }

  if (STRING_SEQUENCE_INTRODUCERS.has(introducer)) {
    return scanStringSequenceEnd(source, escapeStart + 2);
  }

  if (CHARSET_INTRODUCERS.has(introducer)) {
    return escapeStart + 2 < source.length ? escapeStart + 3 : -1;
  }

  return escapeStart + 2;
}

/**
 * Removes ANSI/xterm escape sequences. A sequence split across two socket
 * reads is returned as `carry` so the next chunk can complete it instead of
 * leaking `[0m[01;34m` into the visible output.
 */
export function stripEscapeSequences(chunk: string): EscapeScanResult {
  let plain = "";
  let index = 0;

  while (index < chunk.length) {
    const character = chunk[index];
    if (character !== ESCAPE) {
      plain += character;
      index += 1;
      continue;
    }
    const end = scanEscapeEnd(chunk, index);
    if (end === -1) return { plain, carry: chunk.slice(index) };
    index = end;
  }

  return { plain, carry: "" };
}

function isPrintableControl(character: string): boolean {
  return character === "\n" || character === "\t";
}

function isDroppedControl(character: string): boolean {
  const code = character.charCodeAt(0);
  return (code < 0x20 && !isPrintableControl(character)) || code === 0x7f;
}

/**
 * Renders raw PTY output as plain text: a streaming UTF-8 decoder (so a
 * multi-byte character split across reads is not mangled), escape-sequence
 * removal, carriage-return line overwrite, and a bounded buffer.
 */
export function createPtyTextBuffer(maxChars: number = TERMINAL_BUFFER_MAX_CHARS) {
  const decoder = new TextDecoder("utf-8");
  let text = "";
  let cursor = 0;
  let lineStart = 0;
  let carry = "";
  let lineRestartPending = false;

  function trimToBudget(): void {
    if (text.length <= maxChars) return;
    const removed = text.length - maxChars;
    text = text.slice(removed);
    cursor = Math.max(0, cursor - removed);
    lineStart = Math.max(0, lineStart - removed);
  }

  function writeCharacter(character: string): void {
    if (lineRestartPending) {
      // A carriage return only takes effect once the shell writes over the
      // line; applying it eagerly would swallow the line before a CRLF.
      text = text.slice(0, lineStart);
      cursor = lineStart;
      lineRestartPending = false;
    }
    if (cursor < text.length) {
      text = text.slice(0, cursor) + character + text.slice(cursor + 1);
    } else {
      text += character;
    }
    cursor += 1;
  }

  function appendPlain(plain: string): void {
    for (const character of plain) {
      if (character === "\r") {
        lineRestartPending = true;
        continue;
      }
      if (character === "\n") {
        lineRestartPending = false;
        cursor = text.length;
        text += "\n";
        cursor += 1;
        lineStart = cursor;
        continue;
      }
      if (character === "\b") {
        if (cursor > lineStart) cursor -= 1;
        continue;
      }
      if (isDroppedControl(character)) continue;
      writeCharacter(character);
    }
    trimToBudget();
  }

  function appendText(chunk: string): string {
    const scan = stripEscapeSequences(carry + chunk);
    carry = scan.carry;
    appendPlain(scan.plain);
    return text;
  }

  function appendBytes(bytes: ArrayBuffer | ArrayBufferView): string {
    return appendText(decoder.decode(bytes, { stream: true }));
  }

  function clear(): string {
    text = "";
    cursor = 0;
    lineStart = 0;
    carry = "";
    lineRestartPending = false;
    return text;
  }

  return {
    appendText,
    appendBytes,
    clear,
    get value(): string {
      return text;
    },
  };
}
