type LogLevel = "debug" | "info" | "warn" | "error";

interface FrontendLogger {
  debug: (msg: string, ctx?: unknown) => void;
  info: (msg: string, ctx?: unknown) => void;
  warn: (msg: string, ctx?: unknown) => void;
  error: (msg: string, ctx?: unknown) => void;
}

function emit(level: LogLevel, msg: string, ctx?: unknown): void {
  const mode = import.meta.env.MODE;
  if (mode === "production" || mode === "test") return;
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  if (ctx === undefined) fn(`[swarm-ui] ${msg}`);
  else fn(`[swarm-ui] ${msg}`, ctx);
}

export const frontendLogger: FrontendLogger = {
  debug: (msg, ctx) => emit("debug", msg, ctx),
  info: (msg, ctx) => emit("info", msg, ctx),
  warn: (msg, ctx) => emit("warn", msg, ctx),
  error: (msg, ctx) => emit("error", msg, ctx),
};
