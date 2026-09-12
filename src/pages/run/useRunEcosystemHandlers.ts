/**
 * Entry points that turn an external source — a playbook or a tracker issue —
 * into an ordinary run. Neither creates a task of its own: the server hands
 * back a materialised prompt (plus, for a playbook, the scenario it targets),
 * and the run starts through the same path as the Run button, so there is
 * exactly one task and it is a real one.
 */

export interface PlaybookRunRequestLike {
  prompt: string;
  scenario_id: string;
}

export interface ImportedIssueLike {
  prompt: string;
}

interface EcosystemSettingsLike {
  form: { prompt: string; scenario_id: string | null };
  saveSettingsSoon: () => void;
}

export function useRunEcosystemHandlers(
  settings: EcosystemSettingsLike,
  startRun: () => Promise<void>,
) {
  async function onPlaybookStarted(runRequest: PlaybookRunRequestLike): Promise<void> {
    settings.form.prompt = runRequest.prompt;
    settings.form.scenario_id = runRequest.scenario_id || null;
    await startRun();
  }

  function onIssueImported(issue: ImportedIssueLike): void {
    settings.form.prompt = issue.prompt;
    settings.saveSettingsSoon();
  }

  return { onPlaybookStarted, onIssueImported };
}
