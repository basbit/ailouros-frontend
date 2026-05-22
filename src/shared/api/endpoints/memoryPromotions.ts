import { httpGet, httpPost } from "@/shared/api/http";

interface PromotionCandidatePayload {
  key: string;
  source_level: string;
  usage_count: number;
  distinct_owners: number;
  last_used_at: string;
  quarantined?: boolean;
  payload?: Record<string, unknown>;
}

export interface PromotionEntry {
  id: string;
  created_at: string;
  status: "pending" | "approved" | "reverted";
  candidate: PromotionCandidatePayload;
  note: string;
  target_level: string;
  reason: string;
  decided_at: string;
}

export interface PromotionsListResponse {
  entries: PromotionEntry[];
}

export interface PromotionActionResponse {
  promotion: PromotionEntry;
  audit_path: string;
}

export type PromotionStatusFilter = "pending" | "approved" | "reverted" | "all";

export async function listPromotions(
  workspaceRoot: string,
  status: PromotionStatusFilter = "pending",
  signal?: AbortSignal,
): Promise<PromotionsListResponse> {
  const params = new URLSearchParams({
    workspace_root: workspaceRoot,
    status,
  });
  return httpGet<PromotionsListResponse>(`/v1/memory/promotions?${params.toString()}`, {
    signal,
  });
}

export async function approvePromotion(
  promotionId: string,
  workspaceRoot: string,
  note: string,
  signal?: AbortSignal,
): Promise<PromotionActionResponse> {
  return httpPost<PromotionActionResponse>(
    `/v1/memory/promotions/${encodeURIComponent(promotionId)}/approve`,
    { workspace_root: workspaceRoot, note },
    { signal },
  );
}

export async function revertPromotion(
  promotionId: string,
  workspaceRoot: string,
  note: string,
  signal?: AbortSignal,
): Promise<PromotionActionResponse> {
  return httpPost<PromotionActionResponse>(
    `/v1/memory/promotions/${encodeURIComponent(promotionId)}/revert`,
    { workspace_root: workspaceRoot, note },
    { signal },
  );
}
