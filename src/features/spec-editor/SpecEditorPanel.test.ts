import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import SpecEditorPanel from "./SpecEditorPanel.vue";
import RequirementsTable from "./RequirementsTable.vue";
import DesignDecisionsTree from "./DesignDecisionsTree.vue";
import TaskKanban from "./TaskKanban.vue";
import type {
  DesignDecision,
  Requirement,
  SpecTask,
  SpecValidationResult,
} from "./spec-types";

const REQS: Requirement[] = [
  {
    id: "REQ-001",
    text: "The system shall persist tasks across restarts.",
    priority: "must",
    acceptance: ["Given a saved task, when the app restarts, then it appears."],
    ears: "Ubiquitous",
  },
  {
    id: "REQ-002",
    text: "When the user clicks Save, the system shall write to disk.",
    priority: "should",
    acceptance: [],
  },
];

const ADRS: DesignDecision[] = [
  { id: "ADR-001", title: "Use SQLite WAL", status: "accepted" },
  { id: "ADR-002", title: "Drop legacy JSON store", status: "superseded" },
  { id: "ADR-003", title: "Adopt new queue", status: "proposed" },
];

const TASKS: SpecTask[] = [
  {
    id: "TASK-1",
    title: "Wire schema",
    status: "open",
    depends_on: [],
    requirement_refs: ["REQ-001"],
  },
  {
    id: "TASK-2",
    title: "Migrate data",
    status: "in_progress",
    depends_on: ["TASK-1"],
    requirement_refs: ["REQ-001"],
  },
  {
    id: "TASK-3",
    title: "Cleanup",
    status: "done",
    depends_on: ["TASK-2"],
    requirement_refs: ["REQ-002"],
  },
];

const VALIDATION: SpecValidationResult = {
  ok: false,
  findings: [
    {
      code: "missing-accept",
      severity: "warning",
      message: "REQ-002 has no acceptance",
    },
  ],
};

describe("SpecEditorPanel", () => {
  it("renders all four sub-views with provided props", () => {
    const wrapper = mount(SpecEditorPanel, {
      props: {
        specId: "spec-abc",
        requirements: REQS,
        decisions: ADRS,
        tasks: TASKS,
        initialValidation: VALIDATION,
        autoFetchValidation: false,
      },
    });

    expect(wrapper.text()).toContain("Spec Editor");
    expect(wrapper.text()).toContain("spec-abc");

    expect(wrapper.findComponent(RequirementsTable).exists()).toBe(true);
    expect(wrapper.findComponent(DesignDecisionsTree).exists()).toBe(true);
    expect(wrapper.findComponent(TaskKanban).exists()).toBe(true);
  });

  it("renders an empty state when no props are supplied", () => {
    const wrapper = mount(SpecEditorPanel, {
      props: { autoFetchValidation: false },
    });
    expect(wrapper.text()).toContain("No requirements yet.");
    expect(wrapper.text()).toContain("No design decisions yet.");
    expect(wrapper.text()).toContain("No tasks yet.");
  });
});

describe("RequirementsTable", () => {
  it("lists each requirement with id, text, and priority pill", () => {
    const wrapper = mount(RequirementsTable, { props: { requirements: REQS } });
    expect(wrapper.text()).toContain("REQ-001");
    expect(wrapper.text()).toContain("REQ-002");
    expect(wrapper.text()).toContain("persist tasks");
    expect(wrapper.findAll(".req-table__pill")).toHaveLength(2);
  });
});

describe("DesignDecisionsTree", () => {
  it("groups decisions by status in the canonical order", () => {
    const wrapper = mount(DesignDecisionsTree, { props: { decisions: ADRS } });
    const groups = wrapper.findAll(".adr-group__badge");
    expect(groups).toHaveLength(3);
    expect(groups[0].text()).toBe("accepted");
    expect(groups[1].text()).toBe("proposed");
    expect(groups[2].text()).toBe("superseded");
  });
});

describe("TaskKanban", () => {
  it("renders three columns with their tasks", () => {
    const wrapper = mount(TaskKanban, { props: { tasks: TASKS } });
    const cols = wrapper.findAll(".kanban__col");
    expect(cols).toHaveLength(3);
    expect(cols[0].text()).toContain("TASK-1");
    expect(cols[1].text()).toContain("TASK-2");
    expect(cols[2].text()).toContain("TASK-3");
  });
});
