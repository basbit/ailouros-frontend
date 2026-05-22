import { httpDelete, httpGet, httpPost } from "@/shared/api/http";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  registry?: string;
  installed_at?: string;
  entry?: string;
}

export interface RegistryEntry {
  name: string;
  url: string;
  last_refreshed?: string;
  plugin_count?: number;
  error?: string;
}

export interface SearchHit {
  id: string;
  name: string;
  version: string;
  registry: string;
  description?: string;
  author?: string;
  homepage?: string;
}

interface InstalledPluginsResponse {
  plugins: PluginManifest[];
}

interface RegistriesResponse {
  registries: RegistryEntry[];
}

interface SearchResponse {
  hits: SearchHit[];
}

export async function getInstalledPlugins(): Promise<PluginManifest[]> {
  const data = await httpGet<InstalledPluginsResponse>("/v1/plugins");
  return data.plugins ?? [];
}

export async function getRegistries(): Promise<RegistryEntry[]> {
  const data = await httpGet<RegistriesResponse>("/v1/plugins/registries");
  return data.registries ?? [];
}

export async function addRegistry(url: string, name: string): Promise<RegistryEntry> {
  return httpPost<RegistryEntry>("/v1/plugins/registries", { url, name });
}

export async function refreshRegistry(name: string): Promise<RegistryEntry> {
  return httpPost<RegistryEntry>(
    `/v1/plugins/registries/${encodeURIComponent(name)}/refresh`,
  );
}

export async function searchPlugins(query: string): Promise<SearchHit[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : "";
  const data = await httpGet<SearchResponse>(`/v1/plugins/search${qs}`);
  return data.hits ?? [];
}

export async function installPlugin(
  id: string,
  version: string,
  registry: string,
): Promise<PluginManifest> {
  return httpPost<PluginManifest>("/v1/plugins/install", { id, version, registry });
}

export async function uninstallPlugin(id: string): Promise<void> {
  await httpDelete<{ ok?: boolean }>(`/v1/plugins/${encodeURIComponent(id)}`);
}
