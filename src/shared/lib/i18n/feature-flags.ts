import type { Messages } from "./types";
import { featureFlagsChromeEn, featureFlagsChromeRu } from "./feature-flags-chrome";
import {
  featureFlagsMcpMemoryEn,
  featureFlagsMcpMemoryRu,
} from "./feature-flags-mcp-memory";
import {
  featureFlagsRetrievalEn,
  featureFlagsRetrievalRu,
} from "./feature-flags-retrieval";
import {
  featureFlagsReasoningEfficiencyEn,
  featureFlagsReasoningEfficiencyRu,
} from "./feature-flags-reasoning-efficiency";
import {
  featureFlagsEvalUxOrchWorkspaceEn,
  featureFlagsEvalUxOrchWorkspaceRu,
} from "./feature-flags-eval-ux-orch-workspace";

export const featureFlagsEn: Messages = {
  ...featureFlagsChromeEn,
  ...featureFlagsMcpMemoryEn,
  ...featureFlagsRetrievalEn,
  ...featureFlagsReasoningEfficiencyEn,
  ...featureFlagsEvalUxOrchWorkspaceEn,
};

export const featureFlagsRu: Messages = {
  ...featureFlagsChromeRu,
  ...featureFlagsMcpMemoryRu,
  ...featureFlagsRetrievalRu,
  ...featureFlagsReasoningEfficiencyRu,
  ...featureFlagsEvalUxOrchWorkspaceRu,
};
