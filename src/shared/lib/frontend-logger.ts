type LogLevel = "debug" | "info" | "warn" | "error";

interface FrontendLogger {
  debug: (message: string, context?: unknown) => void;
  info: (message: string, context?: unknown) => void;
  warn: (message: string, context?: unknown) => void;
  error: (message: string, context?: unknown) => void;
}

function emit(level: LogLevel, message: string, context?: unknown): void {
  const mode = import.meta.env.MODE;
  if (mode === "production" || mode === "test") return;
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  if (context === undefined) fn(`[swarm-ui] ${message}`);
  else fn(`[swarm-ui] ${message}`, context);
}

export const frontendLogger: FrontendLogger = {
  debug: (message, context) => emit("debug", message, context),
  info: (message, context) => emit("info", message, context),
  warn: (message, context) => emit("warn", message, context),
  error: (message, context) => emit("error", message, context),
};
