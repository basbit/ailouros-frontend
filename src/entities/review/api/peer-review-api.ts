import { httpGet } from "@/shared/api/http";
import type { PeerReviewResponse } from "../model/types";

export async function getTaskPeerReview(taskId: string): Promise<PeerReviewResponse> {
  return httpGet<PeerReviewResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/peer-review`,
  );
}
