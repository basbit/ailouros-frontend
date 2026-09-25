import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import AutoresearchPage from "../AutoresearchPage.vue";
import type {
  CreateResearchSessionRequest,
  ImproveRolePromptPreset,
  ImproveRolePromptRequest,
  ResearchSession,
  ResearchSessionList,
} from "@/shared/api/endpoints/autoresearch";
import { makeSession } from "@/features/autoresearch/__tests__/fixtures";

const listMock = vi.fn<() => Promise<ResearchSessionList>>();

function listed(sessions: ResearchSession[]): ResearchSessionList {
  return { sessions, corrupt_sessions: [] };
}
const createMock =
  vi.fn<(request: CreateResearchSessionRequest) => Promise<ResearchSession>>();
const getMock = vi.fn<(id: string) => Promise<ResearchSession>>();
const presetMock = vi.fn<() => Promise<ImproveRolePromptPreset>>();
const startPromptMock =
  vi.fn<(request: ImproveRolePromptRequest) => Promise<ResearchSession>>();

vi.mock("@/shared/api/endpoints/autoresearch", () => ({
  listResearchSessions: () => listMock(),
  createResearchSession: (request: CreateResearchSessionRequest) => createMock(request),
  getResearchSession: (id: string) => getMock(id),
  getImproveRolePromptPreset: () => presetMock(),
  startImproveRolePrompt: (request: ImproveRolePromptRequest) => startPromptMock(request),
  cancelResearchSession: vi.fn(),
  applyResearchSession: vi.fn(),
  discardResearchSession: vi.fn(),
  openResearchPullRequest: vi.fn(),
}));

vi.mock("@/app/providers/settingsContext", () => ({
  useInjectedAppSettings: () => ({ form: { workspace_root: "/work/project" } }),
}));

vi.mock("@/entities/agent-config", () => ({
  buildAgentConfig: () => ({ dev: { model: "model-x" } }),
}));

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/autoresearch", component: AutoresearchPage },
      { path: "/autoresearch/:sessionId", component: AutoresearchPage, props: true },
    ],
  });
}

async function mountAt(path: string) {
  const router = makeRouter();
  await router.push(path);
  await router.isReady();
  const wrapper = mount(
    { template: "<RouterView />" },
    { global: { plugins: [router], stubs: { AppHeaderContainer: true } } },
  );
  await flushPromises();
  return { wrapper, router };
}

describe("AutoresearchPage", () => {
  beforeEach(() => {
    listMock.mockReset().mockResolvedValue(listed([makeSession({ status: "completed" })]));
    createMock.mockReset();
    getMock.mockReset();
    presetMock.mockReset().mockResolvedValue({
      workspace_root: "/repo/app",
      roles: ["dev", "pm", "qa"],
      problem: null,
    });
    startPromptMock.mockReset();
  });

  it("starts an Improve role prompt session with the chosen role and budget", async () => {
    startPromptMock.mockResolvedValue(makeSession({ id: "prompt1", status: "starting" }));
    getMock.mockResolvedValue(makeSession({ id: "prompt1", status: "running" }));
    const { wrapper, router } = await mountAt("/autoresearch");

    await wrapper.get('[data-testid="mode-prompt"]').trigger("click");
    await flushPromises();
    expect(wrapper.get('[name="promptWorkspace"]').element).toHaveProperty(
      "value",
      "/repo/app",
    );
    expect(wrapper.get('[data-testid="prompt-result-note"]').text()).toContain(
      "never merged automatically",
    );
    await wrapper.get('[name="promptRole"]').setValue("qa");
    await wrapper.get('[name="promptIterationBudget"]').setValue(4);
    await wrapper.get('[name="promptSamples"]').setValue(3);
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(createMock).not.toHaveBeenCalled();
    expect(startPromptMock.mock.calls[0][0]).toMatchObject({
      role: "qa",
      iteration_budget: 4,
      samples: 3,
      judge_model: "",
      agent_config: { dev: { model: "model-x" } },
    });
    expect(router.currentRoute.value.path).toBe("/autoresearch/prompt1");
  });

  it("shows why the prompt preset cannot run instead of a working form", async () => {
    presetMock.mockResolvedValue({
      workspace_root: null,
      roles: ["pm"],
      problem: "the prompts root is not inside a git repository",
    });
    const { wrapper } = await mountAt("/autoresearch");

    await wrapper.get('[data-testid="mode-prompt"]').trigger("click");
    await flushPromises();
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-testid="prompt-preset-problem"]').text()).toContain(
      "not inside a git repository",
    );
    expect(startPromptMock).not.toHaveBeenCalled();
  });

  it("lists sessions and starts a new one with the dev agent config", async () => {
    createMock.mockResolvedValue(makeSession({ id: "new1", status: "starting" }));
    getMock.mockResolvedValue(makeSession({ id: "new1", status: "completed" }));
    const { wrapper, router } = await mountAt("/autoresearch");

    expect(wrapper.text()).toContain("faster parser");
    await wrapper.get('[name="goal"]').setValue("lower latency");
    await wrapper.get('[name="metricCommand"]').setValue("npm run bench");
    await wrapper.get('[name="mutablePaths"]').setValue("src/**");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    const request = createMock.mock.calls[0][0];
    expect(request).toMatchObject({
      workspace_root: "/work/project",
      goal: "lower latency",
      agent_config: { dev: { model: "model-x" } },
    });
    expect(router.currentRoute.value.path).toBe("/autoresearch/new1");
  });

  it("shows the backend refusal when the start fails", async () => {
    createMock.mockRejectedValue(
      new Error("metric_command 'rm -rf /' is not allowed: denied"),
    );
    const { wrapper } = await mountAt("/autoresearch");
    await wrapper.get('[name="goal"]').setValue("x");
    await wrapper.get('[name="metricCommand"]').setValue("rm -rf /");
    await wrapper.get('[name="mutablePaths"]').setValue("src/**");

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.get('[data-testid="form-error"]').text()).toContain(
      "is not allowed",
    );
  });

  it("opens the session named in the route", async () => {
    getMock.mockResolvedValue(makeSession({ status: "completed" }));

    const { wrapper } = await mountAt("/autoresearch/s1");

    expect(getMock).toHaveBeenCalledWith("s1");
    expect(wrapper.get('[data-testid="session-status"]').text()).toBe("Completed");
  });

  it("reloads the session list when the route moves to another session", async () => {
    listMock.mockResolvedValueOnce(listed([]));
    getMock.mockResolvedValue(
      makeSession({
        id: "later",
        config: { ...makeSession().config, goal: "started elsewhere" },
      }),
    );
    const { wrapper, router } = await mountAt("/autoresearch");
    expect(wrapper.text()).not.toContain("started elsewhere");
    listMock.mockResolvedValue(
      listed([
        makeSession({
          id: "later",
          config: { ...makeSession().config, goal: "started elsewhere" },
        }),
      ]),
    );

    await router.push("/autoresearch/later");
    await flushPromises();

    expect(wrapper.find(".ar-page__list").text()).toContain("started elsewhere");
  });

  it("lists a session with a corrupt event log with its reason instead of hiding it", async () => {
    listMock.mockResolvedValue({
      sessions: [],
      corrupt_sessions: [
        {
          id: "broken1",
          workspace_root: "/work/project",
          status: "corrupt",
          reason: "events.jsonl line 2 is not a valid event",
        },
      ],
    });

    const { wrapper } = await mountAt("/autoresearch");

    const item = wrapper.get('[data-testid="corrupt-session"]');
    expect(item.text()).toContain("broken1");
    expect(item.text()).toContain("Corrupt log");
    expect(item.text()).toContain("line 2 is not a valid event");
    expect(wrapper.text()).not.toContain("No sessions yet");
  });
});
