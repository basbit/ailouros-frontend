import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";

import AgentEditorPage from "./AgentEditorPage.vue";
import { useUxStore } from "@/shared/store/ux";

const deletePipelineById = vi.fn();
const refreshSavedPipelines = vi.fn();

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/features/agent-editor/useEditorStore", () => ({
  useEditorStore: () => ({
    pipeline: ref({ id: "p1", name: "Pipeline one", nodes: [], edges: [] }),
    selectedNode: ref(null),
    saving: ref(false),
    saveError: ref(null),
    savedPipelines: ref([{ id: "p1", name: "Pipeline one" }]),
    listLoading: ref(false),
    listError: ref(null),
    addNode: vi.fn(),
    updateNode: vi.fn(),
    removeNode: vi.fn(),
    addEdge: vi.fn(),
    removeEdge: vi.fn(),
    selectNode: vi.fn(),
    savePipeline: vi.fn(),
    refreshSavedPipelines,
    loadPipelineById: vi.fn(),
    deletePipelineById,
  }),
}));

function mountPage() {
  return mount(AgentEditorPage, {
    global: {
      stubs: {
        ScenarioToolbar: true,
        AgentEditorWorkspace: true,
      },
    },
  });
}

describe("AgentEditorPage — delete confirmation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("asks through the app dialog, never the native browser confirm", async () => {
    const nativeConfirm = vi.spyOn(window, "confirm");
    const ux = useUxStore();
    const confirmSpy = vi.spyOn(ux, "confirmDialog").mockResolvedValue(true);
    const wrapper = mountPage();

    await wrapper.find(".btn-danger").trigger("click");

    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalledWith({
      title: "agentEditor.confirmDeleteTitle",
      message: "agentEditor.confirmDelete",
    });
    nativeConfirm.mockRestore();
    wrapper.unmount();
  });

  it("deletes only once the dialog is confirmed", async () => {
    const ux = useUxStore();
    const confirmSpy = vi.spyOn(ux, "confirmDialog").mockResolvedValue(false);
    const wrapper = mountPage();

    await wrapper.find(".btn-danger").trigger("click");
    expect(deletePipelineById).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue(true);
    await wrapper.find(".btn-danger").trigger("click");
    expect(deletePipelineById).toHaveBeenCalledWith("p1");

    wrapper.unmount();
  });
});
