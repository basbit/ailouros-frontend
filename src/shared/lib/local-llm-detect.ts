export interface LocalLlmDetection {
  ollama: boolean;
  lmStudio: boolean;
  ollamaBaseUrl: string;
  lmStudioBaseUrl: string;
}

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_LM_STUDIO_URL = "http://localhost:1234";

export interface DetectOptions {
  ollamaBaseUrl?: string;
  lmStudioBaseUrl?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

async function probeUrl(
  url: string,
  timeoutMs: number,
  fetcher: typeof fetch,
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function detectLocalLlmProviders(
  options: DetectOptions = {},
): Promise<LocalLlmDetection> {
  const ollamaBaseUrl = options.ollamaBaseUrl ?? DEFAULT_OLLAMA_URL;
  const lmStudioBaseUrl = options.lmStudioBaseUrl ?? DEFAULT_LM_STUDIO_URL;
  const timeoutMs = options.timeoutMs ?? 1500;
  const fetcher = options.fetcher ?? fetch;

  const [ollamaOk, lmStudioOk] = await Promise.all([
    probeUrl(`${ollamaBaseUrl}/api/tags`, timeoutMs, fetcher),
    probeUrl(`${lmStudioBaseUrl}/v1/models`, timeoutMs, fetcher),
  ]);

  return {
    ollama: ollamaOk,
    lmStudio: lmStudioOk,
    ollamaBaseUrl,
    lmStudioBaseUrl,
  };
}

export type LlmOnboardingPath =
  | "download-default-gguf"
  | "use-local-server"
  | "use-cloud"
  | "skip";

export function recommendOnboardingPath(
  detection: LocalLlmDetection,
): LlmOnboardingPath {
  if (detection.ollama || detection.lmStudio) {
    return "use-local-server";
  }
  return "download-default-gguf";
}
