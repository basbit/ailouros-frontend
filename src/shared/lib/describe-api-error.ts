import { ApiError } from "@/shared/api/http";

export function describeApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.body && err.body.trim()) return err.body;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
