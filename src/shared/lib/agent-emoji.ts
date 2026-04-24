function pipelineBaseStep(agent: string): string {
  let step = agent.trim();
  if (step.startsWith("human_")) step = step.slice(6);
  else if (step.startsWith("review_")) step = step.slice(7);
  return step;
}

export function walkerEmojiForAgent(agent: string, taskStatus: string | null): string {
  if (taskStatus === "completed") return "🎉";
  if (taskStatus === "failed") return "💥";

  const baseStep = pipelineBaseStep(agent);
  const emojiByStep: Record<string, string> = {
    pm: "📋",
    ba: "📝",
    arch: "🏛️",
    architect: "🏛️",
    code_quality_architect: "🔍",
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
    image_generator: "🖼️",
    audio_generator: "🔊",
    human_code_review: "👤",
    code_review: "👁️",
    pm_tasks: "📌",
    self_verify: "🔍",
    deep_planning: "🧠",
    swarm_planner: "🗺️",
  };
  if (emojiByStep[baseStep]) return emojiByStep[baseStep];
  if (baseStep.startsWith("crole_") || agent.startsWith("crole_")) return "✨";
  return "🧑‍💻";
}

export function deskSlotForAgent(agent: string): number {
  if (!agent || agent === "orchestrator") return 0;
  if (agent.startsWith("crole_")) return 9;

  const baseStep = pipelineBaseStep(agent);
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
    ["code_quality_architect", 3],
    ["architect", 3],
    ["image_generator", 4],
    ["audio_generator", 4],
    ["devops", 5],
    ["ba", 2],
    ["pm", 1],
    ["qa", 8],
    ["dev", 7],
    ["deep_planning", 1],
    ["self_verify", 7],
    ["swarm_planner", 0],
  ];
  for (const [key, slot] of pairs) {
    if (baseStep === key || baseStep.startsWith(`${key}_`)) return slot;
  }
  if (baseStep === "spec" || baseStep.startsWith("spec_")) return 4;
  return 1;
}
