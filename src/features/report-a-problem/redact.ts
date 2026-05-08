const SECRET_KEY_PATTERNS: RegExp[] = [
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /password/i,
  /authorization/i,
];

const VALUE_PATTERNS: { matcher: RegExp; replacement: string }[] = [
  { matcher: /sk-[A-Za-z0-9]{20,}/g, replacement: "sk-***REDACTED***" },
  { matcher: /Bearer\s+[A-Za-z0-9._-]+/g, replacement: "Bearer ***REDACTED***" },
  {
    matcher: /[A-Z0-9]{20,}\.[A-Za-z0-9._-]{6,}\.[A-Za-z0-9._-]{6,}/g,
    replacement: "***REDACTED-JWT***",
  },
  {
    matcher: /[A-Za-z0-9+/=_-]{40,}/g,
    replacement: "***REDACTED-LONG-TOKEN***",
  },
];

function redactValueByContextKey(input: string): string {
  return input.replace(
    /(["']?)([A-Za-z0-9_]+)\1\s*[:=]\s*(["'])([^"']*)\3/g,
    (match, qLeft, key, qRight, value) => {
      const looksSensitive = SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (!looksSensitive) return match;
      const trimmedValue = String(value).trim();
      if (!trimmedValue) return match;
      return `${qLeft}${key}${qLeft} ${qRight}***REDACTED***${qRight}`.replace(
        /[: ]+/,
        ": ",
      );
    },
  );
}

function redactWithValuePatterns(input: string): string {
  let out = input;
  for (const { matcher, replacement } of VALUE_PATTERNS) {
    out = out.replace(matcher, replacement);
  }
  return out;
}

export function redactSensitive(input: string): string {
  if (!input) return "";
  const stage1 = redactValueByContextKey(input);
  return redactWithValuePatterns(stage1);
}
