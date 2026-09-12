type DiffLineType = "added" | "removed" | "unchanged";

export interface DiffLine {
  type: DiffLineType;
  text: string;
  originalLineNumber: number | null;
  modifiedLineNumber: number | null;
}

export interface DiffSummary {
  addedCount: number;
  removedCount: number;
  unchangedCount: number;
  hasChanges: boolean;
  lines: DiffLine[];
}

function findCommonPrefixLength(
  originalLines: string[],
  modifiedLines: string[],
): number {
  let index = 0;
  while (
    index < originalLines.length &&
    index < modifiedLines.length &&
    originalLines[index] === modifiedLines[index]
  ) {
    index++;
  }
  return index;
}

function findCommonSuffixLength(
  originalLines: string[],
  modifiedLines: string[],
  prefixLength: number,
): number {
  let index = 0;
  const maxSuffix = Math.min(
    originalLines.length - prefixLength,
    modifiedLines.length - prefixLength,
  );
  while (
    index < maxSuffix &&
    originalLines[originalLines.length - 1 - index] ===
      modifiedLines[modifiedLines.length - 1 - index]
  ) {
    index++;
  }
  return index;
}

function buildLcsTable(originalLines: string[], modifiedLines: string[]): number[][] {
  const rows = originalLines.length;
  const cols = modifiedLines.length;
  const table: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(cols + 1).fill(0),
  );

  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= cols; j++) {
      if (originalLines[i - 1] === modifiedLines[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }
  return table;
}

function backtrackLcs(
  originalLines: string[],
  modifiedLines: string[],
  table: number[][],
  prefixLength: number,
): DiffLine[] {
  let i = originalLines.length;
  let j = modifiedLines.length;
  const reversed: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
      reversed.push({
        type: "unchanged",
        text: originalLines[i - 1],
        originalLineNumber: prefixLength + i,
        modifiedLineNumber: prefixLength + j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || table[i][j - 1] >= table[i - 1][j])) {
      reversed.push({
        type: "added",
        text: modifiedLines[j - 1],
        originalLineNumber: null,
        modifiedLineNumber: prefixLength + j,
      });
      j--;
    } else if (i > 0) {
      reversed.push({
        type: "removed",
        text: originalLines[i - 1],
        originalLineNumber: prefixLength + i,
        modifiedLineNumber: null,
      });
      i--;
    }
  }

  return reversed.reverse();
}

function buildFallbackDiff(
  originalLines: string[],
  modifiedLines: string[],
  prefixLength: number,
): DiffLine[] {
  const diffLines: DiffLine[] = [];
  for (let i = 0; i < originalLines.length; i++) {
    diffLines.push({
      type: "removed",
      text: originalLines[i],
      originalLineNumber: prefixLength + i + 1,
      modifiedLineNumber: null,
    });
  }
  for (let j = 0; j < modifiedLines.length; j++) {
    diffLines.push({
      type: "added",
      text: modifiedLines[j],
      originalLineNumber: null,
      modifiedLineNumber: prefixLength + j + 1,
    });
  }
  return diffLines;
}

function summarizeLines(diffLines: DiffLine[]): DiffSummary {
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  for (const line of diffLines) {
    if (line.type === "added") {
      addedCount++;
    } else if (line.type === "removed") {
      removedCount++;
    } else {
      unchangedCount++;
    }
  }

  return {
    addedCount,
    removedCount,
    unchangedCount,
    hasChanges: addedCount > 0 || removedCount > 0,
    lines: diffLines,
  };
}

export function computeLineDiff(
  originalText: string,
  modifiedText: string,
): DiffSummary {
  if (originalText === modifiedText) {
    const lines = originalText ? originalText.split("\n") : [];
    const diffLines: DiffLine[] = lines.map((text, index) => ({
      type: "unchanged",
      text,
      originalLineNumber: index + 1,
      modifiedLineNumber: index + 1,
    }));
    return {
      addedCount: 0,
      removedCount: 0,
      unchangedCount: diffLines.length,
      hasChanges: false,
      lines: diffLines,
    };
  }

  const originalLines = originalText ? originalText.split("\n") : [];
  const modifiedLines = modifiedText ? modifiedText.split("\n") : [];

  const prefixLength = findCommonPrefixLength(originalLines, modifiedLines);
  const suffixLength = findCommonSuffixLength(
    originalLines,
    modifiedLines,
    prefixLength,
  );

  const middleOriginal = originalLines.slice(
    prefixLength,
    originalLines.length - suffixLength,
  );
  const middleModified = modifiedLines.slice(
    prefixLength,
    modifiedLines.length - suffixLength,
  );

  const diffLines: DiffLine[] = [];

  for (let i = 0; i < prefixLength; i++) {
    diffLines.push({
      type: "unchanged",
      text: originalLines[i],
      originalLineNumber: i + 1,
      modifiedLineNumber: i + 1,
    });
  }

  if (middleOriginal.length * middleModified.length <= 4_000_000) {
    const table = buildLcsTable(middleOriginal, middleModified);
    diffLines.push(
      ...backtrackLcs(middleOriginal, middleModified, table, prefixLength),
    );
  } else {
    diffLines.push(...buildFallbackDiff(middleOriginal, middleModified, prefixLength));
  }

  const suffixStartOriginal = originalLines.length - suffixLength;
  const suffixStartModified = modifiedLines.length - suffixLength;
  for (let s = 0; s < suffixLength; s++) {
    diffLines.push({
      type: "unchanged",
      text: originalLines[suffixStartOriginal + s],
      originalLineNumber: suffixStartOriginal + s + 1,
      modifiedLineNumber: suffixStartModified + s + 1,
    });
  }

  return summarizeLines(diffLines);
}
