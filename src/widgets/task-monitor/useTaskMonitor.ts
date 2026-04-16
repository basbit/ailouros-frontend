import { computed, ref, watch } from "vue";
import { useTaskStore } from "@/shared/store/task";
import { useI18n } from "@/shared/lib/i18n";

/** Office desk metadata. Mirrors OFFICE_DESKS in ui.js. */
export interface OfficeDeskMeta {
  slot: number;
  short: string;
  hint: string;
}

export const OFFICE_DESKS: OfficeDeskMeta[] = [
  { slot: 0, short: "Hall", hint: "Entrance / pause" },
  { slot: 1, short: "PM", hint: "Planning" },
  { slot: 2, short: "BA", hint: "Requirements" },
  { slot: 3, short: "Arch", hint: "Architecture / stack" },
  { slot: 4, short: "Spec", hint: "Spec / code analysis" },
  { slot: 5, short: "Ops", hint: "DevOps" },
  { slot: 6, short: "Lead", hint: "Dev Lead" },
  { slot: 7, short: "Dev", hint: "Development" },
  { slot: 8, short: "QA", hint: "Tests" },
  { slot: 9, short: "X", hint: "Custom role" },
];

/** Strip human_ or review_ prefix to get the canonical step name. */
function pipelineBaseStep(agent: string): string {
  let s = agent.trim();
  if (s.startsWith("human_")) s = s.slice(6);
  else if (s.startsWith("review_")) s = s.slice(7);
  return s;
}

/** Emoji for the walking avatar based on current agent and task status. */
export function walkerEmojiForAgent(agent: string, taskStatus: string | null): string {
  if (taskStatus === "completed") return "🎉";
  if (taskStatus === "failed") return "💥";

  const b = pipelineBaseStep(agent);
  const map: Record<string, string> = {
    pm: "📋",
    ba: "📝",
    arch: "🏛️",
    architect: "🏛️",
    dev: "💻",
    qa: "🧪",
    devops: "⚙️",
    dev_lead: "👔",
    problem_spotter: "🔎",
    refactor_plan: "📐",
    code_diagram: "🗺️",
    doc_generate: "📚",
    spec_merge: "📎",
    stack: "📚",
    review_stack: "📚",
    generate_documentation: "📄",
    analyze_code: "🔬",
    human_code_review: "👤",
    code_review: "👁️",
    pm_tasks: "📌",
    // Automation agents — shown between/during pipeline steps
    self_verify: "🔍",
    deep_planning: "🧠",
    swarm_planner: "🗺️",
  };
  if (map[b]) return map[b];
  if (b.startsWith("crole_") || agent.startsWith("crole_")) return "✨";
  return "🧑‍💻";
}

/** Map agent name to an office desk slot (0–9). */
export function deskSlotForAgent(agent: string): number {
  if (!agent || agent === "orchestrator") return 0;
  if (agent.startsWith("crole_")) return 9;

  const b = pipelineBaseStep(agent);
  const pairs: [string, number][] = [
    ["spec_merge", 4],
    ["human_code_review", 4],
    ["code_review", 4],
    ["analyze_code", 4],
    ["generate_documentation", 4],
    ["problem_spotter", 4],
    ["refactor_plan", 4],
    ["dev_lead", 6],
    ["pm_tasks", 6],
    ["review_stack", 3],
    ["stack", 3],
    ["architect", 3],
    ["devops", 5],
    ["ba", 2],
    ["pm", 1],
    ["qa", 8],
    ["dev", 7],
    // Automation agents: position near the step they assist
    ["deep_planning", 1], // assists PM
    ["self_verify", 7], // assists Dev
    ["swarm_planner", 0], // pre-pipeline planning (hall)
  ];
  for (const [key, slot] of pairs) {
    if (b === key || b.startsWith(`${key}_`)) return slot;
  }
  if (b === "spec" || b.startsWith("spec_")) return 4;
  return 1;
}

/** Compute the horizontal percentage position for a given slot. */
export function officePercentForSlot(slot: number): { xPct: number; yPct: number } {
  const n = OFFICE_DESKS.length;
  const clamped = Math.max(0, Math.min(n - 1, slot));
  const xPct = 6 + clamped * (88 / (n - 1));
  return { xPct, yPct: 72 };
}

/** Derived scene state for TaskMonitor.vue to consume. */
export interface OfficeSceneState {
  slot: number;
  xPct: number;
  yPct: number;
  emoji: string;
  label: string;
  statusLine: string;
  deskShort: string;
  deskHint: string;
  isBobbing: boolean;
  isDone: boolean;
  isError: boolean;
  facingLeft: boolean;
  activeSlot: number;
}

/**
 * Task monitor composable.
 *
 * Derives reactive office-scene state from the Pinia task store. Does not
 * touch the DOM — all presentation logic lives in TaskMonitor.vue.
 */
export function useTaskMonitor() {
  const taskStore = useTaskStore();
  const { t } = useI18n();

  /** Previous X percent tracked separately so computed stays pure. */
  const prevXPct = ref<number | null>(null);
  const facingLeft = ref(false);
  const desks = computed<OfficeDeskMeta[]>(() =>
    Array.from({ length: 10 }, (_, slot) => ({
      slot,
      short: t(`taskMonitor.desk.${slot}.short`),
      hint: t(`taskMonitor.desk.${slot}.hint`),
    })),
  );

  const sceneState = computed<OfficeSceneState>(() => {
    const { taskId, status, history } = taskStore;

    if (!taskId) {
      return {
        slot: 0,
        xPct: 5,
        yPct: 78,
        emoji: "🚶",
        label: "—",
        statusLine: "",
        deskShort: "",
        deskHint: "",
        isBobbing: false,
        isDone: false,
        isError: false,
        facingLeft: false,
        activeSlot: -1,
      };
    }

    let slot = 0;
    let label = "—";
    let statusLine = "";
    let isBobbing = false;

    if (status === "completed") {
      slot = 0;
      label = t("taskMonitor.done");
      statusLine = "";
    } else if (status === "failed") {
      slot = 0;
      label = t("taskMonitor.error");
      statusLine = "";
    } else if (history.length > 0) {
      const last = history[history.length - 1];
      const ag = last?.agent ? String(last.agent) : "";
      label = ag || "—";
      slot = deskSlotForAgent(ag);
      // Log lines live in Events feed — floor stays visual-only.
      if (status === "awaiting_human") {
        statusLine = t("taskMonitor.awaitingHuman");
      } else if (status === "awaiting_shell_confirm") {
        statusLine = t("taskMonitor.awaitingShell");
      } else {
        statusLine = "";
      }
      isBobbing = true;
    } else {
      isBobbing = true;
    }

    const pos = officePercentForSlot(slot);
    const deskMeta = desks.value.find((d) => d.slot === slot);

    return {
      slot,
      xPct: pos.xPct,
      yPct: pos.yPct,
      emoji: walkerEmojiForAgent(label === "—" ? "" : label, status),
      label,
      statusLine: statusLine.length >= 120 ? `${statusLine}…` : statusLine,
      deskShort: deskMeta?.short ?? "",
      deskHint: deskMeta?.hint ?? "",
      isBobbing: isBobbing && status !== "completed" && status !== "failed",
      isDone: status === "completed",
      isError: status === "failed",
      facingLeft: facingLeft.value,
      activeSlot: slot,
    };
  });

  // Update direction tracking as a side-effectful watch, separate from computed.
  watch(sceneState, (next, prev) => {
    if (prev === undefined) {
      prevXPct.value = next.xPct;
      return;
    }
    if (!next.slot && !prev.slot) {
      prevXPct.value = null;
      return;
    }
    const px = prevXPct.value;
    if (px !== null) {
      if (next.xPct < px - 0.5) facingLeft.value = true;
      else if (next.xPct > px + 0.5) facingLeft.value = false;
    }
    prevXPct.value = next.xPct;
  });

  return {
    taskStore,
    sceneState,
    desks,
  };
}
