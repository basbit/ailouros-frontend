export type ModelChoice = [string, string];

export function pickModelSelectValue(
  currentModel: string | undefined,
  choices: readonly ModelChoice[],
): string {
  if (!choices.length) return currentModel ?? "";
  const hit = choices.find(([value]) => value === currentModel);
  return hit ? hit[0] : "__custom__";
}

export function resolveModelChange(
  selectedValue: string,
  currentCustomModel: string | undefined,
): string {
  if (selectedValue === "__custom__") return currentCustomModel ?? "";
  return selectedValue;
}
