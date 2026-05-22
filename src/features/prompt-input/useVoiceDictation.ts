import { computed, onBeforeUnmount, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { initApiBase } from "@/shared/api/base";
import { ApiError, httpPost } from "@/shared/api/http";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import { frontendLogger } from "@/shared/lib/frontend-logger";

function logTeardownFailure(operation: string, error: unknown): void {
  frontendLogger.warn(`voice-dictation: ${operation} rejected during teardown`, {
    error: error instanceof Error ? error.message : String(error),
  });
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function hasMediaRecorder(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator?.mediaDevices?.getUserMedia
  );
}

export interface VoiceDictationApi {
  supported: ComputedRef<boolean>;
  active: Ref<boolean>;
  transcribing: Ref<boolean>;
  error: Ref<string | null>;
  start(language?: string): Promise<void>;
  stop(): Promise<void>;
}

export interface VoiceDictationOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
}

export function useVoiceDictation(options: VoiceDictationOptions): VoiceDictationApi {
  const Ctor = getSpeechRecognitionCtor();
  const browserSupported = Ctor !== null;
  const desktopFallback = !browserSupported && isDesktop() && hasMediaRecorder();
  const supported = computed(() => browserSupported || desktopFallback);
  const active = ref(false);
  const transcribing = ref(false);
  const error = ref<string | null>(null);

  let speechInstance: SpeechRecognitionInstance | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let mediaChunks: Blob[] = [];
  let mediaStream: MediaStream | null = null;
  let mediaLanguage = "";

  function ensureSpeechInstance(): SpeechRecognitionInstance | null {
    if (!Ctor) return null;
    if (speechInstance) return speechInstance;
    const next = new Ctor();
    next.continuous = true;
    next.interimResults = true;
    next.onresult = (event) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalChunk += transcript;
        } else {
          interimChunk += transcript;
        }
      }
      if (finalChunk) options.onTranscript(finalChunk, true);
      if (interimChunk) options.onTranscript(interimChunk, false);
    };
    next.onerror = (event) => {
      error.value = String(event?.error ?? "speech-error");
      active.value = false;
    };
    next.onend = () => {
      active.value = false;
    };
    speechInstance = next;
    return next;
  }

  function stopMedia(): void {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
      } catch (caught) {
        logTeardownFailure("MediaRecorder.stop", caught);
      }
    }
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) track.stop();
      mediaStream = null;
    }
  }

  function extractTranscribeDetailMessage(
    body: string | null | undefined,
  ): string | null {
    if (!body) return null;
    try {
      const parsed = JSON.parse(body) as { detail?: { message?: string } };
      return typeof parsed?.detail?.message === "string" ? parsed.detail.message : null;
    } catch {
      return null;
    }
  }

  function describeTranscribeApiError(apiError: ApiError): string {
    return (
      extractTranscribeDetailMessage(apiError.body) ??
      `voice/transcribe HTTP ${apiError.status}`
    );
  }

  async function transcribeBlob(blob: Blob): Promise<void> {
    transcribing.value = true;
    error.value = null;
    try {
      await initApiBase();
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      if (mediaLanguage) form.append("language", mediaLanguage);
      try {
        const data = await httpPost<{ text?: string }>("/v1/voice/transcribe", form);
        const text = (data?.text ?? "").trim();
        if (text) options.onTranscript(text, true);
      } catch (caught) {
        if (caught instanceof ApiError) {
          error.value = describeTranscribeApiError(caught);
          return;
        }
        throw caught;
      }
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught);
    } finally {
      transcribing.value = false;
    }
  }

  async function startMediaRecorder(language?: string): Promise<void> {
    if (!hasMediaRecorder()) {
      error.value = "voice-recording-not-supported";
      return;
    }
    error.value = null;
    mediaLanguage = language ?? "";
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught);
      return;
    }
    mediaChunks = [];
    const recorder = new MediaRecorder(mediaStream);
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) mediaChunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(mediaChunks, {
        type: recorder.mimeType || "audio/webm",
      });
      mediaChunks = [];
      void transcribeBlob(blob);
    };
    mediaRecorder = recorder;
    recorder.start();
    active.value = true;
  }

  async function start(language?: string): Promise<void> {
    if (browserSupported) {
      const recogniser = ensureSpeechInstance();
      if (!recogniser) {
        error.value = "speech-not-supported";
        return;
      }
      error.value = null;
      if (language) recogniser.lang = language;
      try {
        recogniser.start();
        active.value = true;
      } catch (caught) {
        error.value = caught instanceof Error ? caught.message : String(caught);
        active.value = false;
      }
      return;
    }
    if (desktopFallback) {
      await startMediaRecorder(language);
    } else {
      error.value = "voice-not-available";
    }
  }

  async function stop(): Promise<void> {
    if (browserSupported && speechInstance) {
      try {
        speechInstance.stop();
      } catch (caught) {
        logTeardownFailure("SpeechRecognition.stop", caught);
      }
      active.value = false;
      return;
    }
    if (mediaRecorder) {
      stopMedia();
      active.value = false;
    }
  }

  onBeforeUnmount(() => {
    if (speechInstance) {
      try {
        speechInstance.abort();
      } catch (caught) {
        logTeardownFailure("SpeechRecognition.abort", caught);
      }
      speechInstance.onresult = null;
      speechInstance.onerror = null;
      speechInstance.onend = null;
      speechInstance = null;
    }
    stopMedia();
    mediaRecorder = null;
  });

  return { supported, active, transcribing, error, start, stop };
}
