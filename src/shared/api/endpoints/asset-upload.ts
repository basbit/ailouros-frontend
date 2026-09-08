import { ApiError } from "@/shared/api/http";

/** Shared error text for /v1/assets/upload failures so the picker, paste
 *  handler, and the standalone upload dialog all describe errors identically. */
export function describeUploadError(err: unknown): string {
  if (err instanceof ApiError) {
    let detail: string | null = null;
    try {
      const parsed = JSON.parse(err.body ?? "") as { detail?: unknown };
      if (typeof parsed?.detail === "string") detail = parsed.detail;
    } catch {
      detail = null;
    }
    return detail ?? `HTTP ${err.status}`;
  }
  return err instanceof Error ? err.message : String(err);
}
