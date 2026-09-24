import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { KeepAlive, defineComponent, h, ref } from "vue";
import { useProjectsStore, buildEmptySnap } from "@/entities/project";
import type {
  ServerRunListing,
  ServerRunRow,
} from "@/shared/api/endpoints/run-history";
import { SERVER_RUN_LIMIT, useServerRunHistory } from "./useServerRunHistory";

const listServerRuns = vi.fn();

vi.mock("@/shared/api/endpoints/run-history", () => ({
  listServerRuns: (input: unknown) => listServerRuns(input),
}));

const EMPTY_LISTING: ServerRunListing = { runs: [], total: 0, unreadable: 0 };

const STALE_RUN: ServerRunRow = {
  taskId: "stale-answer",
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T10:04:00.000Z",
  prompt: "an answer that arrived too late",
  promptTruncated: false,
  scenarioId: null,
  scenarioTitle: null,
  status: "completed",
  pipelineSteps: [],
  workspaceRoot: "",
  hasPipelineSnapshot: true,
};

const Probe = defineComponent({
  setup() {
    const history = useServerRunHistory();
    return { ...history };
  },
  render() {
    return h("div", this.loadError);
  },
});

function mountProbe() {
  return mount(Probe);
}

function mountInsideKeepAlive() {
  const shown = ref(true);
  const wrapper = mount({
    setup: () => () => h(KeepAlive, [shown.value ? h(Probe) : h("span")]),
  });
  return { wrapper, shown };
}

describe("useServerRunHistory", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    listServerRuns.mockReset();
    listServerRuns.mockResolvedValue(EMPTY_LISTING);
  });

  it("asks for the current project's workspace root", async () => {
    const projects = useProjectsStore();
    projects.data = {
      v: 1,
      current: "p1",
      projects: {
        p1: {
          name: "P1",
          snap: { ...buildEmptySnap(), workspace_root: "/tmp/project-a" },
        },
      },
    };

    const wrapper = mountProbe();
    await flushPromises();

    expect(listServerRuns).toHaveBeenCalledWith({
      limit: SERVER_RUN_LIMIT,
      workspaceRoot: "/tmp/project-a",
    });
    wrapper.unmount();
  });

  it("does not fetch twice when the page is kept alive on its first render", async () => {
    const { wrapper } = mountInsideKeepAlive();
    await flushPromises();

    expect(listServerRuns).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("refetches when the kept-alive page is shown again", async () => {
    const { wrapper, shown } = mountInsideKeepAlive();
    await flushPromises();

    shown.value = false;
    await flushPromises();
    shown.value = true;
    await flushPromises();

    expect(listServerRuns).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("reports the failure and empties the rows when the backend is unreachable", async () => {
    listServerRuns.mockRejectedValue(new Error("Failed to fetch"));

    const wrapper = mountProbe();
    await flushPromises();

    expect(wrapper.vm.loadError).toBe("Failed to fetch");
    expect(wrapper.vm.serverRuns).toEqual([]);
    expect(wrapper.vm.loading).toBe(false);
    wrapper.unmount();
  });

  it("clears a previous failure once a retry succeeds", async () => {
    listServerRuns.mockRejectedValueOnce(new Error("Failed to fetch"));

    const wrapper = mountProbe();
    await flushPromises();
    expect(wrapper.vm.loadError).toBe("Failed to fetch");

    await wrapper.vm.reload();

    expect(wrapper.vm.loadError).toBe("");
    wrapper.unmount();
  });

  it("ignores a slow answer that a newer request already replaced", async () => {
    let releaseFirst: (value: ServerRunListing) => void = () => {};
    listServerRuns.mockReturnValueOnce(
      new Promise<ServerRunListing>((resolve) => {
        releaseFirst = resolve;
      }),
    );

    const wrapper = mountProbe();
    listServerRuns.mockResolvedValue(EMPTY_LISTING);
    await wrapper.vm.reload();

    releaseFirst({ runs: [STALE_RUN], total: 1, unreadable: 0 });
    await flushPromises();

    expect(wrapper.vm.serverRuns).toEqual([]);
    expect(wrapper.vm.loading).toBe(false);
    wrapper.unmount();
  });
});
