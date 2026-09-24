interface PhaseLoopHistoryEntry {
  readonly from: string;
  readonly to: string;
  readonly reason: string;
}

interface PhaseLoopSnapshot {
  readonly scenario: string;
  readonly currentPhase: string;
  readonly history: readonly PhaseLoopHistoryEntry[];
}

interface WikiContextTier {
  readonly tier: string;
  readonly reason: string;
}

interface EntailmentVerdict {
  readonly verdict: string;
  readonly score: number;
  readonly reason: string;
}

interface CitationEnforcementNode {
  readonly mode: string;
  readonly accepted: boolean;
  readonly coverageScore: number;
  readonly citedClaims: number;
  readonly totalClaims: number;
  readonly violations: number;
}

interface CitationEnforcementReport {
  readonly nodes: readonly {
    readonly node: string;
    readonly data: CitationEnforcementNode;
  }[];
}

interface RagasMetricScore {
  readonly score: number;
  readonly reason: string;
}

interface RagasMetrics {
  readonly scores: Readonly<Record<string, RagasMetricScore>>;
}

interface SkillDispatchDiagnostic {
  readonly skillId: string;
  readonly reason: string;
  readonly dispatcher: string;
  readonly mode: string;
}

interface WorkspaceIsolation {
  readonly mode: string;
  readonly branch: string;
}

type SecurityRewriteStatus = "ok" | "degraded" | "disabled";

interface SecurityRewriteDiagnostic {
  readonly status: SecurityRewriteStatus;
  readonly riskLevel: string;
  readonly flags: readonly string[];
}

interface MemoryDiagnostics {
  readonly crossTaskEnabled: boolean;
  readonly crossTaskDurable: boolean;
  readonly patternEnabled: boolean;
  readonly patternEntries: number;
  readonly wikiArticles: number;
}

interface DevShellSandbox {
  readonly requested: boolean;
  readonly profile: string;
  readonly active: boolean;
}

export interface RunDiagnostics {
  readonly taskId: string;
  readonly phaseLoop: PhaseLoopSnapshot | null;
  readonly wikiContextTier: WikiContextTier | null;
  readonly entailmentVerdict: EntailmentVerdict | null;
  readonly citation: CitationEnforcementReport | null;
  readonly ragasMetrics: RagasMetrics | null;
  readonly skillDispatch: SkillDispatchDiagnostic | null;
  readonly workspaceIsolation: WorkspaceIsolation | null;
  readonly securityRewrite: SecurityRewriteDiagnostic | null;
  readonly devShellSandbox: DevShellSandbox | null;
  readonly memory: MemoryDiagnostics | null;
  readonly enableHints: Readonly<Record<string, string>>;
}

interface RawPhaseLoop {
  scenario?: unknown;
  current_phase?: unknown;
  history?: unknown;
}

interface RawWikiTier {
  tier?: unknown;
  reason?: unknown;
}

interface RawEntailment {
  verdict?: unknown;
  score?: unknown;
  reason?: unknown;
}

interface RawCitationNode {
  mode?: unknown;
  accepted?: unknown;
  coverage_score?: unknown;
  cited_claims?: unknown;
  total_claims?: unknown;
  violations?: unknown;
}

interface RawRagasMetricScore {
  score?: unknown;
  reason?: unknown;
}

interface RawSkillDispatch {
  skill_id?: unknown;
  reason?: unknown;
  dispatcher?: unknown;
  mode?: unknown;
}

interface RawWorkspaceIsolation {
  mode?: unknown;
  branch?: unknown;
}

interface RawPayload {
  task_id?: unknown;
  phase_loop?: unknown;
  wiki_context_tier?: unknown;
  entailment_verdict?: unknown;
  citation_enforcement?: unknown;
  ragas_metrics?: unknown;
  skill_dispatch?: unknown;
  workspace_isolation?: unknown;
  security_rewrite?: unknown;
  dev_shell_sandbox?: unknown;
  memory?: unknown;
  enable_hints?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readNonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;
}

function parsePhaseLoop(raw: unknown): PhaseLoopSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPhaseLoop;
  const scenario = readString(candidate.scenario);
  const currentPhase = readString(candidate.current_phase);
  if (!scenario || !currentPhase) return null;
  const historyRaw = Array.isArray(candidate.history) ? candidate.history : [];
  const history: PhaseLoopHistoryEntry[] = [];
  for (const item of historyRaw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as { from?: unknown; to?: unknown; reason?: unknown };
    const fromValue = readString(entry.from);
    const toValue = readString(entry.to);
    if (!fromValue || !toValue) continue;
    history.push({
      from: fromValue,
      to: toValue,
      reason: readString(entry.reason),
    });
  }
  return { scenario, currentPhase, history };
}

function parseWikiTier(raw: unknown): WikiContextTier | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawWikiTier;
  const tier = readString(candidate.tier);
  if (!tier) return null;
  return { tier, reason: readString(candidate.reason) };
}

function parseEntailment(raw: unknown): EntailmentVerdict | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawEntailment;
  const verdict = readString(candidate.verdict);
  if (!verdict) return null;
  return {
    verdict,
    score: readNumber(candidate.score),
    reason: readString(candidate.reason),
  };
}

function parseCitationNode(raw: unknown): CitationEnforcementNode | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawCitationNode;
  return {
    mode: readString(candidate.mode),
    accepted: Boolean(candidate.accepted),
    coverageScore: readNumber(candidate.coverage_score),
    citedClaims: readNonNegativeInt(candidate.cited_claims),
    totalClaims: readNonNegativeInt(candidate.total_claims),
    violations: readNonNegativeInt(candidate.violations),
  };
}

function parseRagasMetrics(raw: unknown): RagasMetrics | null {
  if (!raw || typeof raw !== "object") return null;
  const entries = Object.entries(raw as Record<string, unknown>);
  const scores: Record<string, RagasMetricScore> = {};
  for (const [metric, value] of entries) {
    if (!value || typeof value !== "object") continue;
    const candidate = value as RawRagasMetricScore;
    scores[metric] = {
      score: readNumber(candidate.score),
      reason: readString(candidate.reason),
    };
  }
  if (Object.keys(scores).length === 0) return null;
  return { scores };
}

function parseSkillDispatch(raw: unknown): SkillDispatchDiagnostic | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawSkillDispatch;
  const skillId = readString(candidate.skill_id).trim();
  if (!skillId) return null;
  return {
    skillId,
    reason: readString(candidate.reason),
    dispatcher: readString(candidate.dispatcher),
    mode: readString(candidate.mode),
  };
}

function parseWorkspaceIsolation(raw: unknown): WorkspaceIsolation | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawWorkspaceIsolation;
  const mode = readString(candidate.mode).trim();
  const branch = readString(candidate.branch).trim();
  if (!mode || !branch) return null;
  return { mode, branch };
}

const SECURITY_REWRITE_STATUSES: readonly string[] = ["ok", "degraded", "disabled"];

function isSecurityRewriteStatus(value: string): value is SecurityRewriteStatus {
  return SECURITY_REWRITE_STATUSES.includes(value);
}

function parseSecurityRewrite(raw: unknown): SecurityRewriteDiagnostic | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const status = readString(candidate.status).trim();
  if (!isSecurityRewriteStatus(status)) return null;
  const rawFlags = Array.isArray(candidate.flags) ? candidate.flags : [];
  return {
    status,
    riskLevel: readString(candidate.risk_level).trim(),
    flags: rawFlags
      .map((flag) => readString(flag).trim())
      .filter((flag) => flag.length > 0),
  };
}

function parseDevShellSandbox(raw: unknown): DevShellSandbox | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const profile = readString(candidate.profile).trim();
  if (!profile) return null;
  return {
    requested: candidate.requested === true,
    profile,
    active: candidate.active === true,
  };
}

function parseMemoryDiagnostics(raw: unknown): MemoryDiagnostics | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const cross = (candidate.cross_task ?? {}) as Record<string, unknown>;
  const pattern = (candidate.pattern ?? {}) as Record<string, unknown>;
  const wiki = (candidate.wiki ?? {}) as Record<string, unknown>;
  return {
    crossTaskEnabled: cross.enabled === true,
    crossTaskDurable: cross.durable === true,
    patternEnabled: pattern.enabled === true,
    patternEntries: typeof pattern.entries === "number" ? pattern.entries : 0,
    wikiArticles: typeof wiki.articles === "number" ? wiki.articles : 0,
  };
}

function parseEnableHints(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const hints: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && value.length > 0) hints[key] = value;
  }
  return hints;
}

function parseCitation(raw: unknown): CitationEnforcementReport | null {
  if (!raw || typeof raw !== "object") return null;
  const entries = Object.entries(raw as Record<string, unknown>);
  const nodes: { node: string; data: CitationEnforcementNode }[] = [];
  for (const [node, value] of entries) {
    const parsed = parseCitationNode(value);
    if (parsed !== null) nodes.push({ node, data: parsed });
  }
  if (nodes.length === 0) return null;
  return { nodes };
}

export function parseRunDiagnosticsPayload(raw: unknown): RunDiagnostics | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPayload;
  const taskId = readString(candidate.task_id);
  if (!taskId) return null;
  return {
    taskId,
    phaseLoop: parsePhaseLoop(candidate.phase_loop),
    wikiContextTier: parseWikiTier(candidate.wiki_context_tier),
    entailmentVerdict: parseEntailment(candidate.entailment_verdict),
    citation: parseCitation(candidate.citation_enforcement),
    ragasMetrics: parseRagasMetrics(candidate.ragas_metrics),
    skillDispatch: parseSkillDispatch(candidate.skill_dispatch),
    workspaceIsolation: parseWorkspaceIsolation(candidate.workspace_isolation),
    securityRewrite: parseSecurityRewrite(candidate.security_rewrite),
    devShellSandbox: parseDevShellSandbox(candidate.dev_shell_sandbox),
    memory: parseMemoryDiagnostics(candidate.memory),
    enableHints: parseEnableHints(candidate.enable_hints),
  };
}
