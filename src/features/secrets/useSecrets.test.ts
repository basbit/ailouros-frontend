import { describe, it, expect, vi, beforeEach } from "vitest";

const api = vi.hoisted(() => ({
  listSecretNames: vi.fn(),
  saveSecret: vi.fn(),
  deleteSecret: vi.fn(),
}));
vi.mock("@/shared/api/endpoints/secrets", () => api);

import { useSecrets } from "./useSecrets";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSecrets", () => {
  it("refresh populates names", async () => {
    api.listSecretNames.mockResolvedValue(["TAVILY_API_KEY"]);
    const secrets = useSecrets();
    await secrets.refresh();
    expect(secrets.names.value).toEqual(["TAVILY_API_KEY"]);
    expect(secrets.error.value).toBeNull();
  });

  it("save stores then refreshes", async () => {
    api.saveSecret.mockResolvedValue(undefined);
    api.listSecretNames.mockResolvedValue(["NEW_KEY"]);
    const secrets = useSecrets();
    await secrets.save("NEW_KEY", "value");
    expect(api.saveSecret).toHaveBeenCalledWith("NEW_KEY", "value");
    expect(secrets.names.value).toEqual(["NEW_KEY"]);
  });

  it("remove deletes then refreshes", async () => {
    api.deleteSecret.mockResolvedValue(undefined);
    api.listSecretNames.mockResolvedValue([]);
    const secrets = useSecrets();
    await secrets.remove("OLD_KEY");
    expect(api.deleteSecret).toHaveBeenCalledWith("OLD_KEY");
    expect(secrets.names.value).toEqual([]);
  });

  it("refresh records the error message on failure", async () => {
    api.listSecretNames.mockRejectedValue(new Error("500 boom"));
    const secrets = useSecrets();
    await secrets.refresh();
    expect(secrets.error.value).toBe("500 boom");
  });
});
