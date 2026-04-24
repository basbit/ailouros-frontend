import { apiUrl } from "@/shared/api/base";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseJsonBody<T>(r: Response): Promise<T> {
  const text = await r.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("invalid JSON", r.status, text);
  }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    throw new ApiError(`HTTP ${r.status}`, r.status, errText);
  }
  return parseJsonBody<T>(r);
}

export async function fetchText(path: string, init?: RequestInit): Promise<string> {
  const r = await fetch(apiUrl(path), init);
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    throw new ApiError(`HTTP ${r.status}`, r.status, errText);
  }
  return r.text();
}
