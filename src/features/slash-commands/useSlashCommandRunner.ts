import { readonly, ref } from "vue";

import { dispatchSkill } from "@/shared/api/endpoints/skill-dispatcher";
import { evaluateQuickFix } from "@/shared/api/endpoints/quick-fix";
import {
  parseQuickFixPayload,
  tryParseDispatchOrQuick,
  type DispatchOrQuickIntent,
} from "@/shared/lib/slash-commands";

export interface SlashCommandOutcome {
  readonly kind: "dispatch" | "quick";
  readonly summary: string;
}

const lastOutcome = ref<SlashCommandOutcome | null>(null);
const lastError = ref<string | null>(null);
const running = ref(false);

export function resetSlashCommandRunner(): void {
  lastOutcome.value = null;
  lastError.value = null;
  running.value = false;
}

async function _runDispatch(
  intent: DispatchOrQuickIntent,
  scenario: string,
): Promise<SlashCommandOutcome> {
  if (!intent.payload) {
    throw new Error("/dispatch needs a task description");
  }
  const decision = await dispatchSkill({
    scenario,
    phase: "",
    userInput: intent.payload,
  });
  return {
    kind: "dispatch",
    summary: `${decision.skillId} (${decision.dispatcher}/${decision.mode}) — ${decision.reason}`,
  };
}

async function _runQuick(intent: DispatchOrQuickIntent): Promise<SlashCommandOutcome> {
  const payload = parseQuickFixPayload(intent.payload);
  if (!payload.description || payload.targetFiles.length === 0) {
    throw new Error("/quick needs `description | file1,file2 | estimated_loc`");
  }
  const decision = await evaluateQuickFix(payload);
  const blocker = decision.blockingRule ? ` (blocked by ${decision.blockingRule})` : "";
  return {
    kind: "quick",
    summary: `${decision.verdict}${blocker} — ${decision.reason}`,
  };
}

export interface TryRunOptions {
  readonly scenario?: string;
}

export function useSlashCommandRunner() {
  async function tryRun(
    rawPrompt: string,
    options: TryRunOptions = {},
  ): Promise<SlashCommandOutcome | null> {
    const scenario = options.scenario ?? "default";
    const intent = tryParseDispatchOrQuick(rawPrompt);
    if (!intent) return null;
    running.value = true;
    lastError.value = null;
    try {
      const outcome =
        intent.kind === "dispatch"
          ? await _runDispatch(intent, scenario)
          : await _runQuick(intent);
      lastOutcome.value = outcome;
      return outcome;
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : String(caught);
      lastError.value = message;
      throw caught;
    } finally {
      running.value = false;
    }
  }

  return {
    tryRun,
    lastOutcome: readonly(lastOutcome),
    lastError: readonly(lastError),
    running: readonly(running),
    clear: resetSlashCommandRunner,
  };
}
