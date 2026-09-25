import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { useUxStore } from "@/shared/store/ux";
import { deleteAutorunRule } from "@/shared/api/endpoints/issue-autopilot";

vi.mock("@/shared/api/endpoints/issue-autopilot", () => ({
  fetchAutorunConfig: vi.fn().mockResolvedValue({
    rules: [
      {
        rule_id: "r1",
        source: "github",
        repository_key: "acme/app",
        workspace_root: "/work/app",
        scenario_id: "fix_bug",
        label: "swarm",
        target_branch: "main",
        enabled: true,
        allow_command_exec: false,
      },
    ],
    status: {
      github_secret_configured: false,
      linear_secret_configured: true,
      ready: false,
      not_ready_reason: "no server-side LLM provider is ready",
      github_webhook_path: "/v1/integrations/issues/webhook/github",
      linear_webhook_path: "/v1/integrations/issues/webhook/linear",
    },
  }),
  fetchAutorunEvents: vi.fn().mockResolvedValue([
    {
      recorded_at: "2026-09-24T10:00:00+00:00",
      kind: "pull_request_opened",
      delivery_id: "github:d1",
      source: "github",
      issue_url: "https://github.com/acme/app/issues/5",
      message: "branch pushed",
      task_id: "0ba2c905-c7cf",
      pull_request_url: "https://github.com/acme/app/pull/9",
      rule_id: "r1",
    },
    {
      recorded_at: "2026-09-24T10:00:01+00:00",
      kind: "failed",
      delivery_id: "github:d2",
      source: "github",
      issue_url: "javascript:alert(1)",
      message: "run ended with status 'failed'",
      task_id: "",
      pull_request_url: "",
      rule_id: "r1",
    },
  ]),
  createAutorunRule: vi.fn(),
  updateAutorunRule: vi.fn(),
  deleteAutorunRule: vi.fn(),
}));

import IssueAutopilotPanel from "./IssueAutopilotPanel.vue";

async function mountPanel() {
  const wrapper = mount(IssueAutopilotPanel, { global: { stubs: { RouterLink: RouterLinkStub } } });
  await flushPromises();
  return wrapper;
}

describe("IssueAutopilotPanel", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(deleteAutorunRule).mockReset();
  });

  it("shows why webhooks and runs would be refused", async () => {
    const wrapper = await mountPanel();
    const text = wrapper.text();

    expect(text).toContain("/v1/integrations/issues/webhook/github");
    expect(text).toContain("SWARM_GITHUB_WEBHOOK_SECRET");
    expect(text).toContain("no server-side LLM provider is ready");
    expect(text).toContain("acme/app");
  });

  it("links each event to its run and pull request, and never renders a non-http link", async () => {
    const wrapper = await mountPanel();

    const taskLink = wrapper.findComponent(RouterLinkStub);
    expect(taskLink.props("to")).toBe("/history/0ba2c905-c7cf");
    const hrefs = wrapper.findAll("a").map((anchor) => anchor.attributes("href"));
    expect(hrefs).toContain("https://github.com/acme/app/pull/9");
    expect(hrefs).not.toContain("javascript:alert(1)");
    expect(wrapper.text()).toContain("javascript:alert(1)");
  });

  function deleteButton(wrapper: Awaited<ReturnType<typeof mountPanel>>) {
    const button = wrapper
      .findAll(".autopilot__rule button")
      .find((candidate) => candidate.text() === "Delete");
    if (!button) throw new Error("no delete button");
    return button;
  }

  it("asks through the app dialog before deleting, and a cancel deletes nothing", async () => {
    const nativeConfirm = vi.spyOn(window, "confirm");
    const ux = useUxStore();
    const confirmSpy = vi.spyOn(ux, "confirmDialog").mockResolvedValue(false);
    const wrapper = await mountPanel();

    await deleteButton(wrapper).trigger("click");
    await flushPromises();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0].message).toContain("acme/app");
    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(deleteAutorunRule).not.toHaveBeenCalled();
  });

  it("sends one DELETE however often the button is clicked while it is in flight", async () => {
    vi.spyOn(useUxStore(), "confirmDialog").mockResolvedValue(true);
    let finish: () => void = () => undefined;
    vi.mocked(deleteAutorunRule).mockImplementation(
      () => new Promise<never>((resolve) => { finish = () => resolve(undefined as never); }),
    );
    const wrapper = await mountPanel();

    await deleteButton(wrapper).trigger("click");
    await flushPromises();
    expect(deleteButton(wrapper).attributes("disabled")).toBeDefined();
    await deleteButton(wrapper).trigger("click");
    await flushPromises();
    finish();
    await flushPromises();

    expect(deleteAutorunRule).toHaveBeenCalledTimes(1);
    expect(deleteAutorunRule).toHaveBeenCalledWith("r1");
  });

  it("shows command execution as an opt-in with a warning", async () => {
    const wrapper = await mountPanel();
    const checkbox = wrapper.find("input[data-test='allow-command-exec']");

    expect((checkbox.element as HTMLInputElement).checked).toBe(false);
    expect(wrapper.find("[data-test='allow-command-exec-warning']").exists()).toBe(false);
    await checkbox.setValue(true);
    expect(wrapper.find("[data-test='allow-command-exec-warning']").exists()).toBe(true);
  });
});
