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

interface PostPipelineGates {
  readonly prmScore: number | null;
  readonly prmReason: string;
  readonly verifierVerdict: string;
  readonly verifierReason: string;
}

interface FlareSignal {
  readonly verdict: string;
  readonly confidence: number;
  readonly sampleCount: number;
  readonly reason: string;
  readonly round: number;
}

export interface RunDiagnostics {
  readonly taskId: string;
  readonly phaseLoop: PhaseLoopSnapshot | null;
  readonly wikiContextTier: WikiContextTier | null;
  readonly entailmentVerdict: EntailmentVerdict | null;
  readonly citation: CitationEnforcementReport | null;
  readonly postPipelineGates: PostPipelineGates | null;
  readonly flareSignal: FlareSignal | null;
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

interface RawPostPipelineGates {
  prm_score?: unknown;
  prm_reason?: unknown;
  verifier_verdict?: unknown;
  verifier_reason?: unknown;
}

interface RawFlareSignal {
  verdict?: unknown;
  confidence?: unknown;
  sample_count?: unknown;
  reason?: unknown;
  round?: unknown;
}

interface RawPayload {
  task_id?: unknown;
  phase_loop?: unknown;
  wiki_context_tier?: unknown;
  entailment_verdict?: unknown;
  citation_enforcement?: unknown;
  post_pipeline_gates?: unknown;
  flare_signal?: unknown;
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

function parsePostPipelineGates(raw: unknown): PostPipelineGates | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPostPipelineGates;
  const hasPrm =
    typeof candidate.prm_score === "number" && Number.isFinite(candidate.prm_score);
  const hasVerifier =
    typeof candidate.verifier_verdict === "string" &&
    candidate.verifier_verdict.length > 0;
  if (!hasPrm && !hasVerifier) return null;
  return {
    prmScore: hasPrm ? Number(candidate.prm_score) : null,
    prmReason: readString(candidate.prm_reason),
    verifierVerdict: readString(candidate.verifier_verdict),
    verifierReason: readString(candidate.verifier_reason),
  };
}

function parseFlareSignal(raw: unknown): FlareSignal | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawFlareSignal;
  const verdict = readString(candidate.verdict);
  if (!verdict) return null;
  return {
    verdict,
    confidence: readNumber(candidate.confidence),
    sampleCount: readNonNegativeInt(candidate.sample_count),
    reason: readString(candidate.reason),
    round: readNonNegativeInt(candidate.round),
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
    postPipelineGates: parsePostPipelineGates(candidate.post_pipeline_gates),
    flareSignal: parseFlareSignal(candidate.flare_signal),
    enableHints: parseEnableHints(candidate.enable_hints),
  };
}
