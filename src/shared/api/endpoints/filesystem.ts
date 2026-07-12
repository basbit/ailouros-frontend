import { httpGet } from "@/shared/api/http";

export interface DirectoryEntry {
  name: string;
  path: string;
}

export interface DirectoryListing {
  path: string;
  parent: string | null;
  entries: DirectoryEntry[];
}

export async function listDirectories(path: string): Promise<DirectoryListing> {
  const query = path ? `?path=${encodeURIComponent(path)}` : "";
  return httpGet<DirectoryListing>(`/v1/fs/directories${query}`);
}
