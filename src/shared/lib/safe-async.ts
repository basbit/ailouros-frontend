import { frontendLogger } from "@/shared/lib/frontend-logger";

/**
 * Run a side-effecting operation, swallowing any thrown error and logging it as
 * a warning with `context`. Consolidates the repeated
 * `try { ... } catch (e) { frontendLogger.warn("<ctx>", e) }` blocks.
 */
export function safeWarn(context: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    frontendLogger.warn(context, error);
  }
}

/**
 * Run an async (or sync) operation, returning its value on success. On any
 * thrown/rejected error, log a warning with `context` and return `fallback`.
 * Replaces the swallow-and-warn-with-fallback blocks scattered across the
 * transport and store layers.
 */
export async function runCatchingWarn<T>(
  fn: () => T | Promise<T>,
  fallback: T,
  context: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    frontendLogger.warn(context, error);
    return fallback;
  }
}

/**
 * Parse a JSON string, returning `fallback` when `raw` is empty/null or cannot
 * be parsed. When `context` is provided, malformed JSON is logged as a warning;
 * empty/null input is a normal "nothing stored" case and is never warned.
 */
export function parseJsonOr<T>(
  raw: string | null | undefined,
  fallback: T,
  context?: string,
): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    if (context) frontendLogger.warn(context, error);
    return fallback;
  }
}
