import { ApiError } from "@/shared/api/http";

/** The backend's `detail` text of a failed call, else the error message. */
export function describeApiError(err: unknown): string {
  if (err instanceof ApiError && err.body) {
    try {
      const parsed = JSON.parse(err.body) as { detail?: unknown };
      if (typeof parsed.detail === "string") return parsed.detail;
    } catch {
      return err.body;
    }
  }
  return err instanceof Error ? err.message : String(err);
}
