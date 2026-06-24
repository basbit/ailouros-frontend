import { httpGet, httpPut, httpDelete } from "@/shared/api/http";

export async function listSecretNames(): Promise<string[]> {
  const raw = await httpGet<{ names?: unknown }>("/v1/secrets");
  return Array.isArray(raw.names) ? raw.names.map((name) => String(name)) : [];
}

export async function saveSecret(name: string, value: string): Promise<void> {
  await httpPut("/v1/secrets", { name, value });
}

export async function deleteSecret(name: string): Promise<void> {
  await httpDelete(`/v1/secrets/${encodeURIComponent(name)}`);
}
