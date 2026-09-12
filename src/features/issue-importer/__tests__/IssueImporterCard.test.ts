import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import IssueImporterCard from "../IssueImporterCard.vue";
import * as issueApi from "@/entities/issue-ingress/api/issue-ingress-api";

vi.mock("@/entities/issue-ingress/api/issue-ingress-api", () => ({
  importIssue: vi.fn(),
  createPullRequest: vi.fn(),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      if (values?.url) return `PR Created: ${values.url}`;
      if (values?.error) return `Error: ${values.error}`;
      return key;
    },
  }),
}));

describe("IssueImporterCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input field and imports issue on submit", async () => {
    vi.mocked(issueApi.importIssue).mockResolvedValue({
      source: "github",
      title: "Add dark mode theme",
      body: "Support dark mode across all pages",
      author: "octocat",
      labels: ["enhancement", "ui"],
      prompt: "Synthesized prompt",
      branch_name: "feature/gh-42-dark-mode",
      issue_url: "https://github.com/octocat/repo/issues/42",
    });

    const wrapper = mount(IssueImporterCard);
    const input = wrapper.find("input");
    await input.setValue("https://github.com/octocat/repo/issues/42");

    const importButton = wrapper.findAll("button")[0];
    await importButton.trigger("click");
    await flushPromises();

    expect(issueApi.importIssue).toHaveBeenCalledWith(
      "https://github.com/octocat/repo/issues/42",
    );
    expect(wrapper.text()).toContain("Add dark mode theme");
    expect(wrapper.text()).toContain("feature/gh-42-dark-mode");
    expect(wrapper.text()).toContain("octocat");
    expect(wrapper.text()).toContain("enhancement");
  });

  it("creates pull request and renders PR URL", async () => {
    vi.mocked(issueApi.importIssue).mockResolvedValue({
      source: "linear",
      title: "Fix crash on reload",
      body: "App crashes when reload is called",
      author: "dev-team",
      labels: ["bug"],
      prompt: "Synthesized prompt",
      branch_name: "feature/linear-99-fix-crash",
      issue_url: "https://linear.app/team/issue/ENG-99",
    });

    vi.mocked(issueApi.createPullRequest).mockResolvedValue({
      pull_request_url: "https://github.com/team/repo/pull/123",
      branch_name: "feature/linear-99-fix-crash",
      title: "Fix crash on reload",
      head_commit: "abcdef123",
    });

    const wrapper = mount(IssueImporterCard, {
      props: { workspaceRoot: "/Users/dev/projects/app" },
    });
    const input = wrapper.find("input");
    await input.setValue("https://linear.app/team/issue/ENG-99");

    await wrapper.findAll("button")[0].trigger("click");
    await flushPromises();

    const createPrButton = wrapper.findAll("button")[1];
    expect(createPrButton.text()).toBe("issueIngress.createPr");
    await createPrButton.trigger("click");
    await flushPromises();

    expect(issueApi.createPullRequest).toHaveBeenCalledWith({
      workspace_root: "/Users/dev/projects/app",
      branch_name: "feature/linear-99-fix-crash",
      title: "Fix crash on reload",
      body: "App crashes when reload is called",
    });

    expect(wrapper.text()).toContain(
      "PR Created: https://github.com/team/repo/pull/123",
    );
  });

  it("refuses to create a pull request when no workspace root is configured", async () => {
    // Defaulting the workspace is what made this button run `git checkout -B`
    // inside the swarm's own checkout instead of the user's project.
    vi.mocked(issueApi.importIssue).mockResolvedValue({
      source: "github",
      title: "Fix crash on reload",
      body: "App crashes when reload is called",
      author: "dev-team",
      labels: ["bug"],
      prompt: "Synthesized prompt",
      branch_name: "feature/gh-99-fix-crash",
      issue_url: "https://github.com/team/repo/issues/99",
    });

    const wrapper = mount(IssueImporterCard);
    await wrapper.find("input").setValue("https://github.com/team/repo/issues/99");
    await wrapper.findAll("button")[0].trigger("click");
    await flushPromises();

    const createPrButton = wrapper.findAll("button")[1];
    expect(createPrButton.attributes("disabled")).toBeDefined();

    await createPrButton.trigger("click");
    await flushPromises();

    expect(issueApi.createPullRequest).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    vi.mocked(issueApi.importIssue).mockRejectedValue(
      new Error("API rate limit exceeded"),
    );

    const wrapper = mount(IssueImporterCard);
    const input = wrapper.find("input");
    await input.setValue("https://github.com/test/repo/issues/1");

    await wrapper.findAll("button")[0].trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Error: API rate limit exceeded");
  });
});
