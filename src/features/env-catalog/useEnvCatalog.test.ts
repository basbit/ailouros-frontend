import { describe, expect, it, vi, beforeEach } from "vitest";

const fetchEnvCatalog = vi.fn();
const saveEnvOverrides = vi.fn();

vi.mock("@/shared/api/endpoints/env-catalog", () => ({
  fetchEnvCatalog: (...args: unknown[]) => fetchEnvCatalog(...args),
  saveEnvOverrides: (...args: unknown[]) => saveEnvOverrides(...args),
}));

import { useEnvCatalog } from "./useEnvCatalog";

function variable(overrides: Record<string, unknown> = {}) {
  return {
    name: "SWARM_COMMAND_TIMEOUT",
    group: "Execution",
    default: "300",
    description: "Timeout for a shell command",
    kind: "integer",
    is_secret: false,
    value: "",
    is_set: false,
    managed_by_ui_field: "",
    ...overrides,
  };
}

describe("useEnvCatalog", () => {
  beforeEach(() => {
    fetchEnvCatalog.mockReset();
    saveEnvOverrides.mockReset();
  });

  it("groups variables and filters them by the search query", async () => {
    fetchEnvCatalog.mockResolvedValue([
      variable(),
      variable({
        name: "SWARM_ALLOW_COMMAND_EXEC",
        group: "Security",
        kind: "boolean",
      }),
    ]);
    const catalog = useEnvCatalog();
    await catalog.load();

    expect(catalog.groups.value.map((group) => group.name)).toEqual([
      "Execution",
      "Security",
    ]);

    catalog.query.value = "security";
    expect(catalog.groups.value).toHaveLength(1);
    expect(catalog.groups.value[0].variables[0].name).toBe("SWARM_ALLOW_COMMAND_EXEC");
  });

  it("only sends variables whose value actually changed", async () => {
    fetchEnvCatalog.mockResolvedValue([
      variable({ value: "300" }),
      variable({ name: "SWARM_OTHER" }),
    ]);
    saveEnvOverrides.mockResolvedValue({
      status: "ok",
      updated: ["SWARM_COMMAND_TIMEOUT"],
      rejected: [],
    });
    const catalog = useEnvCatalog();
    await catalog.load();

    catalog.setValue("SWARM_COMMAND_TIMEOUT", "300");
    expect(catalog.dirtyNames.value).toEqual([]);

    catalog.setValue("SWARM_COMMAND_TIMEOUT", "42");
    expect(catalog.dirtyNames.value).toEqual(["SWARM_COMMAND_TIMEOUT"]);

    await catalog.save();
    expect(saveEnvOverrides).toHaveBeenCalledWith({ SWARM_COMMAND_TIMEOUT: "42" });
  });

  it("surfaces rejected variables as an error", async () => {
    fetchEnvCatalog.mockResolvedValue([variable()]);
    saveEnvOverrides.mockResolvedValue({
      status: "ok",
      updated: [],
      rejected: ["SWARM_WORKSPACE_ROOT"],
    });
    const catalog = useEnvCatalog();
    await catalog.load();
    catalog.setValue("SWARM_COMMAND_TIMEOUT", "9");

    await catalog.save();

    expect(catalog.error.value).toContain("SWARM_WORKSPACE_ROOT");
  });
});
