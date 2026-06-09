import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const wikiQualityApi = vi.hoisted(() => ({
  getWikiQualityReport: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/wiki-quality", () => wikiQualityApi);
vi.mock("@/shared/api/base", () => ({
  initApiBase: vi.fn().mockResolvedValue(undefined),
}));

const sampleReport = {
  version: 1,
  workspace_root: "/tmp/ws",
  wiki_root: "/tmp/ws/.swarm/wiki",
  summary: {
    article_count: 2,
    chunk_count: 5,
    findings_by_severity: { info: 0, warning: 1, error: 0 },
  },
  findings: [
    {
      rule: "paragraph_length",
      severity: "warning",
      article_path: "tiny",
      message: "section 'Tiny': chunk is short (10 chars, min 80)",
      suggestion: "merge with neighbouring section",
    },
  ],
};

beforeEach(() => {
  wikiQualityApi.getWikiQualityReport.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useWikiQualityAudit", () => {
  it("populates report after run()", async () => {
    wikiQualityApi.getWikiQualityReport.mockResolvedValue(sampleReport);
    const { useWikiQualityAudit } = await import("./useWikiQualityAudit");
    const audit = useWikiQualityAudit();
    await audit.run("/tmp/ws");
    expect(audit.report.value?.summary.article_count).toBe(2);
    expect(audit.loading.value).toBe(false);
    expect(audit.error.value).toBeNull();
  });

  it("rejects blank workspace without calling the API", async () => {
    const { useWikiQualityAudit } = await import("./useWikiQualityAudit");
    const audit = useWikiQualityAudit();
    await audit.run("   ");
    expect(audit.error.value).toContain("workspace_root");
    expect(wikiQualityApi.getWikiQualityReport).not.toHaveBeenCalled();
  });

  it("captures API errors into error ref", async () => {
    wikiQualityApi.getWikiQualityReport.mockRejectedValue(new Error("boom"));
    const { useWikiQualityAudit } = await import("./useWikiQualityAudit");
    const audit = useWikiQualityAudit();
    await audit.run("/tmp/ws");
    expect(audit.error.value).toBe("boom");
    expect(audit.report.value).toBeNull();
  });

  it("clear() resets the cached report", async () => {
    wikiQualityApi.getWikiQualityReport.mockResolvedValue(sampleReport);
    const { useWikiQualityAudit } = await import("./useWikiQualityAudit");
    const audit = useWikiQualityAudit();
    await audit.run("/tmp/ws");
    audit.clear();
    expect(audit.report.value).toBeNull();
    expect(audit.error.value).toBeNull();
  });
});
