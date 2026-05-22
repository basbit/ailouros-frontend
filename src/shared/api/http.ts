import { apiUrl } from "@/shared/api/base";
import { ApiError } from "@/shared/api/client";

export interface HttpRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  rawPath?: boolean;
  timeoutMs?: number;
}

function mergeSignals(
  caller?: AbortSignal,
  timeoutMs?: number,
): { signal?: AbortSignal; cleanup: () => void } {
  if (!caller && !timeoutMs) return { cleanup: () => {} };
  const controller = new AbortController();
  const cleanups: Array<() => void> = [];
  if (caller) {
    if (caller.aborted) controller.abort();
    else {
      const onAbort = () => controller.abort();
      caller.addEventListener("abort", onAbort, { once: true });
      cleanups.push(() => caller.removeEventListener("abort", onAbort));
    }
  }
  if (timeoutMs && timeoutMs > 0) {
    const handle = setTimeout(() => controller.abort(), timeoutMs);
    cleanups.push(() => clearTimeout(handle));
  }
  return {
    signal: controller.signal,
    cleanup: () => cleanups.forEach((fn) => fn()),
  };
}

async function performRequest(
  method: string,
  path: string,
  body: unknown,
  options: HttpRequestOptions = {},
): Promise<Response> {
  const url = options.rawPath ? path : apiUrl(path);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };
  let serialised: BodyInit | null = null;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof Blob || typeof body === "string") {
      serialised = body as BodyInit;
    } else {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      serialised = JSON.stringify(body);
    }
  }
  const { signal, cleanup } = mergeSignals(options.signal, options.timeoutMs);
  const init: RequestInit = {
    method,
    headers,
    body: serialised,
    signal,
  };
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new ApiError(`HTTP ${response.status}`, response.status, errText);
    }
    return response;
  } finally {
    cleanup();
  }
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("invalid JSON", response.status, text);
  }
}

export async function httpGet<T>(
  path: string,
  options?: HttpRequestOptions,
): Promise<T> {
  const response = await performRequest("GET", path, undefined, options);
  return parseJsonBody<T>(response);
}

export async function httpPost<T = unknown>(
  path: string,
  body?: unknown,
  options?: HttpRequestOptions,
): Promise<T> {
  const response = await performRequest("POST", path, body, options);
  return parseJsonBody<T>(response);
}

export async function httpDelete<T = unknown>(
  path: string,
  options?: HttpRequestOptions,
): Promise<T> {
  const response = await performRequest("DELETE", path, undefined, options);
  return parseJsonBody<T>(response);
}

export async function httpRequestRaw(
  method: string,
  path: string,
  body?: unknown,
  options?: HttpRequestOptions,
): Promise<Response> {
  return performRequest(method, path, body, options);
}

export { ApiError };
