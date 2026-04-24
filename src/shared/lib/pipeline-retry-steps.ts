export const ALL_PIPELINE_STEPS = [
  "dev_lead",
  "dev",
  "review_dev",
  "qa",
  "review_qa",
] as const;

export type PipelineStep = (typeof ALL_PIPELINE_STEPS)[number];
