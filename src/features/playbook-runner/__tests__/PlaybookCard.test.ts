import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import PlaybookCard from "../PlaybookCard.vue";
import * as playbookApi from "@/entities/playbook/api/playbook-api";
import type { Playbook } from "@/entities/playbook/model/types";

vi.mock("@/entities/playbook/api/playbook-api", () => ({
  runPlaybook: vi.fn(),
  fetchPlaybooks: vi.fn(),
  fetchPlaybook: vi.fn(),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      if (values?.taskId) return `Task: ${values.taskId}`;
      if (values?.error) return `Error: ${values.error}`;
      return key;
    },
  }),
}));

const samplePlaybook: Playbook = {
  id: "db_migration",
  name: "Database Schema Migration",
  category: "database",
  description: "Deterministic schema migration",
  target_scenario_id: "build_feature",
  steps: [
    {
      id: "step_1",
      name: "Schema Design",
      description: "Design the schema",
      role: "architect",
      expected_artifact: "plan.md",
    },
    {
      id: "step_2",
      name: "Run Migration",
      description: "Apply SQL",
      role: "developer",
      expected_artifact: null,
    },
  ],
  parameters: [
    {
      name: "table_name",
      parameter_type: "string",
      description: "Table name",
      default: "orders",
      required: true,
    },
  ],
};

describe("PlaybookCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders playbook information and default parameter value", () => {
    const wrapper = mount(PlaybookCard, {
      props: {
        playbook: samplePlaybook,
      },
    });

    expect(wrapper.text()).toContain("Database Schema Migration");
    expect(wrapper.text()).toContain("database");
    expect(wrapper.text()).toContain("Schema Design");
    expect(wrapper.text()).toContain("[architect]");

    const input = wrapper.find<HTMLInputElement>("input#param-table_name");
    expect(input.exists()).toBe(true);
    expect(input.element.value).toBe("orders");
  });

  it("submits parameters and emits started event on run", async () => {
    vi.mocked(playbookApi.runPlaybook).mockResolvedValue({
      playbook_id: "db_migration",
      playbook_name: "Database Schema Migration",
      prompt: "Synthesized prompt",
      scenario_id: "build_feature",
      parameters: { table_name: "customers" },
    });

    const wrapper = mount(PlaybookCard, {
      props: {
        playbook: samplePlaybook,
      },
    });

    const input = wrapper.find<HTMLInputElement>("input#param-table_name");
    await input.setValue("customers");

    const runButton = wrapper.find("button");
    await runButton.trigger("click");
    await flushPromises();

    expect(playbookApi.runPlaybook).toHaveBeenCalledWith("db_migration", {
      parameters: { table_name: "customers" },
    });

    const startedEvents = wrapper.emitted("started");
    expect(startedEvents).toBeTruthy();
    expect(startedEvents?.[0]?.[0]).toMatchObject({
      playbook_id: "db_migration",
      scenario_id: "build_feature",
      prompt: "Synthesized prompt",
    });

    expect(wrapper.text()).toContain("playbooks.started");
  });

  it("refuses to run while a required parameter is empty", async () => {
    // The `*` marker used to be decoration: the parameter was simply omitted
    // from the payload and the run started anyway.
    const wrapper = mount(PlaybookCard, {
      props: {
        playbook: samplePlaybook,
      },
    });

    await wrapper.find<HTMLInputElement>("input#param-table_name").setValue("  ");
    await wrapper.find("button").trigger("click");
    await flushPromises();

    expect(playbookApi.runPlaybook).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("playbooks.missingParameter");
  });

  it("handles run failure and shows error message", async () => {
    vi.mocked(playbookApi.runPlaybook).mockRejectedValue(new Error("Network timeout"));

    const wrapper = mount(PlaybookCard, {
      props: {
        playbook: samplePlaybook,
      },
    });

    const runButton = wrapper.find("button");
    await runButton.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Error: Network timeout");
  });
});
