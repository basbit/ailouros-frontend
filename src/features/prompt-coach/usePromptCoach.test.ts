import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const promptLibraryApi = vi.hoisted(() => ({
  listPromptTemplates: vi.fn(),
  getPromptTemplate: vi.fn(),
  renderPromptTemplate: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/prompt-library", () => promptLibraryApi);
vi.mock("@/shared/api/base", () => ({
  initApiBase: vi.fn().mockResolvedValue(undefined),
}));

const catalogResponse = {
  version: 1,
  packs: [
    {
      id: "swarm-core",
      title: "Swarm core",
      description: "Core templates",
      source: { url: "", version: "v1", license_status: "project-owned" },
    },
  ],
  templates: [
    {
      id: "improve-request",
      pack_id: "swarm-core",
      title: "Improve request",
      description: "Sharpen a rough task",
      category: "general",
      requires_user_confirmation: true,
      status: "enabled" as const,
      source: { url: "", version: "v1", license_status: "project-owned" },
    },
  ],
};

const templateDetail = {
  ...catalogResponse.templates[0],
  inputs: [
    {
      name: "rough_request",
      label: "Rough request",
      kind: "long_text" as const,
      required: true,
      placeholder: "",
      options: [],
      default_value: "",
    },
    {
      name: "language",
      label: "Language",
      kind: "select" as const,
      required: false,
      placeholder: "",
      options: ["auto", "english"],
      default_value: "auto",
    },
  ],
};

beforeEach(() => {
  promptLibraryApi.listPromptTemplates.mockReset();
  promptLibraryApi.getPromptTemplate.mockReset();
  promptLibraryApi.renderPromptTemplate.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("usePromptCoach", () => {
  it("starts on picker stage after open()", async () => {
    promptLibraryApi.listPromptTemplates.mockResolvedValue(catalogResponse);
    const { usePromptCoach } = await import("./usePromptCoach");
    const { _resetPromptLibraryCatalogForTests } =
      await import("@/entities/prompt-template/model/usePromptLibraryCatalog");
    _resetPromptLibraryCatalogForTests();
    const coach = usePromptCoach();
    await coach.open();
    expect(coach.state.stage).toBe("picker");
    expect(coach.templates.value).toHaveLength(1);
  });

  it("moves to form on selectTemplate and seeds default values", async () => {
    promptLibraryApi.listPromptTemplates.mockResolvedValue(catalogResponse);
    promptLibraryApi.getPromptTemplate.mockResolvedValue(templateDetail);
    const { usePromptCoach } = await import("./usePromptCoach");
    const { _resetPromptLibraryCatalogForTests } =
      await import("@/entities/prompt-template/model/usePromptLibraryCatalog");
    _resetPromptLibraryCatalogForTests();
    const coach = usePromptCoach();
    await coach.open();
    await coach.selectTemplate("improve-request");
    expect(coach.state.stage).toBe("form");
    expect(coach.state.selectedTemplate?.id).toBe("improve-request");
    expect(coach.state.inputValues.language).toBe("auto");
    expect(coach.canRender.value).toBe(false);
  });

  it("requires required inputs before render", async () => {
    promptLibraryApi.listPromptTemplates.mockResolvedValue(catalogResponse);
    promptLibraryApi.getPromptTemplate.mockResolvedValue(templateDetail);
    const { usePromptCoach } = await import("./usePromptCoach");
    const { _resetPromptLibraryCatalogForTests } =
      await import("@/entities/prompt-template/model/usePromptLibraryCatalog");
    _resetPromptLibraryCatalogForTests();
    const coach = usePromptCoach();
    await coach.open();
    await coach.selectTemplate("improve-request");
    coach.setInput("rough_request", "build a tracker");
    expect(coach.canRender.value).toBe(true);
  });

  it("renders preview and exposes used inputs", async () => {
    promptLibraryApi.listPromptTemplates.mockResolvedValue(catalogResponse);
    promptLibraryApi.getPromptTemplate.mockResolvedValue(templateDetail);
    promptLibraryApi.renderPromptTemplate.mockResolvedValue({
      template_id: "improve-request",
      body: "rendered body",
      used_inputs: { rough_request: "build a tracker", language: "auto" },
    });
    const { usePromptCoach } = await import("./usePromptCoach");
    const { _resetPromptLibraryCatalogForTests } =
      await import("@/entities/prompt-template/model/usePromptLibraryCatalog");
    _resetPromptLibraryCatalogForTests();
    const coach = usePromptCoach();
    await coach.open();
    await coach.selectTemplate("improve-request");
    coach.setInput("rough_request", "build a tracker");
    const rendered = await coach.render();
    expect(rendered?.body).toBe("rendered body");
    expect(coach.state.stage).toBe("preview");
  });

  it("back from preview returns to form", async () => {
    promptLibraryApi.listPromptTemplates.mockResolvedValue(catalogResponse);
    promptLibraryApi.getPromptTemplate.mockResolvedValue(templateDetail);
    promptLibraryApi.renderPromptTemplate.mockResolvedValue({
      template_id: "improve-request",
      body: "rendered body",
      used_inputs: { rough_request: "build a tracker", language: "auto" },
    });
    const { usePromptCoach } = await import("./usePromptCoach");
    const { _resetPromptLibraryCatalogForTests } =
      await import("@/entities/prompt-template/model/usePromptLibraryCatalog");
    _resetPromptLibraryCatalogForTests();
    const coach = usePromptCoach();
    await coach.open();
    await coach.selectTemplate("improve-request");
    coach.setInput("rough_request", "build a tracker");
    await coach.render();
    coach.back();
    expect(coach.state.stage).toBe("form");
    expect(coach.state.rendered).toBeNull();
  });
});
