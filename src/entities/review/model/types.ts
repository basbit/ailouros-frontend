export type ReviewVerdict = "lgtm" | "needs_fixes";

export interface ReviewFinding {
  file_path: string;
  line_number: number;
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
}

export interface PeerReviewReport {
  verdict: ReviewVerdict;
  findings: ReviewFinding[];
  summary: string;
}

export interface PeerReviewResponse {
  task_id: string;
  has_report: boolean;
  report: PeerReviewReport | null;
}
