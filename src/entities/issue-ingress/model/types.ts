export interface ImportIssueRequest {
  url: string;
}

export interface ImportIssueResponse {
  source: string;
  title: string;
  body: string;
  author: string;
  labels: string[];
  prompt: string;
  branch_name: string;
  issue_url: string;
}

export interface CreatePullRequestRequest {
  /** Required: without it the backend used to run `git checkout -B` inside the
   * swarm's own checkout instead of the user's project. */
  workspace_root: string;
  branch_name: string;
  title: string;
  body: string;
  target_branch?: string;
}

export interface CreatePullRequestResponse {
  pull_request_url: string;
  branch_name: string;
  title: string;
  head_commit: string;
}
