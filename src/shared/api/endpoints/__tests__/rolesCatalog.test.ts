import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getRolesCatalog,
  resetRolesCatalogCacheForTests,
  type RolesCatalog,
} from "@/shared/api/endpoints/rolesCatalog";

const SAMPLE_CATALOG: RolesCatalog = {
  version: 1,
  default_environment: "ollama",
  default_environment_desktop: "local",
  model_placeholders: { local: "local-default" },
  roles: [
    {
      id: "pm",
      label: "PM",
      category: "planning",
      prompt_path: "pm.md",
      prompt_choices: [["pm.md", "PM"]],
      model_defaults: { ollama: "qwen2.5:14b" },
    },
  ],
  remote_api_base_presets: { anthropic: "" },
  remote_profile_provider_options: [["anthropic", "Anthropic"]],
  default_remote_api_provider: "anthropic",
};

function _response(body: unknown, status: number, etag: string): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (etag) headers.set("ETag", etag);
  return new Response(status === 304 ? null : JSON.stringify(body), {
    status,
    headers,
  });
}

describe("rolesCatalog endpoint", () => {
  beforeEach(() => {
    resetRolesCatalogCacheForTests();
  });

  it("fetches the catalog and caches the response", async () => {
    const fetchMock = vi.fn(async () => _response(SAMPLE_CATALOG, 200, '"etag-a"'));
    vi.stubGlobal("fetch", fetchMock);

    const first = await getRolesCatalog();
    expect(first.roles[0].id).toBe("pm");

    const second = await getRolesCatalog();
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("revalidates with If-None-Match and reuses cache on 304", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(_response(SAMPLE_CATALOG, 200, '"etag-a"'))
      .mockResolvedValueOnce(_response(null, 304, '"etag-a"'));
    vi.stubGlobal("fetch", fetchMock);

    const first = await getRolesCatalog();
    const refetched = await getRolesCatalog(true);

    expect(refetched).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCallInit = fetchMock.mock.calls[1][1] as RequestInit;
    const headers = secondCallInit.headers as Record<string, string>;
    expect(headers["If-None-Match"]).toBe('"etag-a"');
  });

  it("replaces cache when the server returns a different payload", async () => {
    const updated: RolesCatalog = {
      ...SAMPLE_CATALOG,
      version: 2,
      roles: [
        {
          id: "dev",
          label: "Dev",
          category: "engineering",
          prompt_path: "dev.md",
          prompt_choices: [],
          model_defaults: {},
        },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(_response(SAMPLE_CATALOG, 200, '"etag-a"'))
      .mockResolvedValueOnce(_response(updated, 200, '"etag-b"'));
    vi.stubGlobal("fetch", fetchMock);

    await getRolesCatalog();
    const refreshed = await getRolesCatalog(true);

    expect(refreshed.version).toBe(2);
    expect(refreshed.roles[0].id).toBe("dev");
  });
});
