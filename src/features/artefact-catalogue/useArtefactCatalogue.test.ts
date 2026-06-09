import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArtefactCatalogueReport } from "@/entities/artefact-catalogue";

import { resetArtefactCatalogue, useArtefactCatalogue } from "./useArtefactCatalogue";

const fetchMock =
  vi.fn<
    (input: {
      scenario: string;
      workspaceRoot: string;
    }) => Promise<ArtefactCatalogueReport>
  >();

vi.mock("@/shared/api/endpoints/artefact-catalogue", () => ({
  getArtefactReport: (input: { scenario: string; workspaceRoot: string }) =>
    fetchMock(input),
}));

function buildReport(
  overrides: Partial<ArtefactCatalogueReport> = {},
): ArtefactCatalogueReport {
  return {
    scenario: "default",
    required: [],
    presentByCategory: {},
    missing: [],
    empty: [],
    uncategorised: [],
    isComplete: true,
    ...overrides,
  };
}

describe("useArtefactCatalogue", () => {
  beforeEach(() => {
    resetArtefactCatalogue();
    fetchMock.mockReset();
  });

  it("starts with no report", () => {
    const catalogue = useArtefactCatalogue();
    expect(catalogue.report.value).toBeNull();
    expect(catalogue.visible.value).toBe(false);
  });

  it("refresh skips network when scenario or workspaceRoot is blank", async () => {
    const catalogue = useArtefactCatalogue();
    await catalogue.refresh({ scenario: "", workspaceRoot: "/tmp/w" });
    await catalogue.refresh({ scenario: "default", workspaceRoot: "" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refresh populates the report and toggles loading", async () => {
    fetchMock.mockResolvedValue(
      buildReport({ scenario: "code-feature", required: ["features"] }),
    );
    const catalogue = useArtefactCatalogue();
    const requestPromise = catalogue.refresh({
      scenario: "code-feature",
      workspaceRoot: "/tmp/w",
    });
    expect(catalogue.loading.value).toBe(true);
    await requestPromise;
    expect(catalogue.loading.value).toBe(false);
    expect(catalogue.report.value?.required).toEqual(["features"]);
  });

  it("refresh records error and clears nothing when the request fails", async () => {
    fetchMock.mockResolvedValueOnce(buildReport());
    fetchMock.mockRejectedValueOnce(new Error("500 Internal"));
    const catalogue = useArtefactCatalogue();
    await catalogue.refresh({ scenario: "default", workspaceRoot: "/tmp/w" });
    await catalogue.refresh({ scenario: "default", workspaceRoot: "/tmp/w" });
    expect(catalogue.lastError.value).toBe("500 Internal");
    expect(catalogue.report.value?.scenario).toBe("default");
  });

  it("clear resets the composable", async () => {
    fetchMock.mockResolvedValue(buildReport());
    const catalogue = useArtefactCatalogue();
    await catalogue.refresh({ scenario: "default", workspaceRoot: "/tmp/w" });
    catalogue.clear();
    expect(catalogue.report.value).toBeNull();
  });
});
