/**
 * Single HTTP client for all REST calls (plan §20.3.1).
 *
 * Before this module landed, 9 places in the frontend called `fetch()`
 * directly without an interceptor → no consistent error handling, no
 * abort cancellation, no auth header injection point. Endpoints that
 * needed credentials or signal cancellation rolled their own retry/abort
 * boilerplate.
 *
 * Usage:
 *
 *   const data = await httpGet<TaskList>("/v1/tasks", { signal });
 *   await httpPost("/v1/tasks/abc/cancel", null, { signal });
 *
 * All requests:
 *   • prefix `apiUrl(...)` (same logic as the legacy `client.ts`),
 *   • carry `Accept: application/json` by default,
 *   • accept an `AbortSignal` so callers can cancel on unmount,
 *   • throw `ApiError` with status+body on non-2xx responses.
 *
 * Wire interceptors via `registerRequestInterceptor` /
 * `registerResponseInterceptor`. They run in registration order.
 */

import { apiUrl } from "@/shared/api/base";
import { ApiError } from "@/shared/api/client";

export type RequestInterceptor = (
  url: string,
  init: RequestInit,
) => RequestInit | Promise<RequestInit>;

export type ResponseInterceptor = (
  response: Response,
  url: string,
) => Response | Promise<Response>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export function registerRequestInterceptor(fn: RequestInterceptor): void {
  requestInterceptors.push(fn);
}

export function registerResponseInterceptor(fn: ResponseInterceptor): void {
  responseInterceptors.push(fn);
}

export interface HttpRequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
  rawPath?: boolean;
  timeoutMs?: number;
}

async function applyRequestInterceptors(
  url: string,
  init: RequestInit,
): Promise<RequestInit> {
  let current = init;
  for (const fn of requestInterceptors) {
    current = await fn(url, current);
  }
  return current;
}

async function applyResponseInterceptors(
  response: Response,
  url: string,
): Promise<Response> {
  let current = response;
  for (const fn of responseInterceptors) {
    current = await fn(current, url);
  }
  return current;
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
  const finalInit = await applyRequestInterceptors(url, init);
  try {
    const response = await fetch(url, finalInit);
    const finalResponse = await applyResponseInterceptors(response, url);
    if (!finalResponse.ok) {
      const errText = await finalResponse.text().catch(() => "");
      throw new ApiError(`HTTP ${finalResponse.status}`, finalResponse.status, errText);
    }
    return finalResponse;
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

export async function httpPut<T = unknown>(
  path: string,
  body?: unknown,
  options?: HttpRequestOptions,
): Promise<T> {
  const response = await performRequest("PUT", path, body, options);
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
