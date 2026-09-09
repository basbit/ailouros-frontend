export interface SandboxProfile {
  name: string;
  runner: string;
  cpu_limit_seconds: number;
  memory_limit_mb: number;
  timeout_seconds: number;
  network: string;
  docker_image: string;
}

export interface SandboxStatus {
  default_profile: string;
  available_profiles_count: number;
  execution_backend: string;
}

export interface SandboxRunCommandPayload {
  command: string[];
  stdin?: string;
  profile_name?: string;
  extra_env?: Record<string, string>;
}

export interface SandboxRunCommandResult {
  verdict: string;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  duration_seconds: number;
  truncated: boolean;
  message: string;
}
