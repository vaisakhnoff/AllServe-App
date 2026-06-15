type LogLevel = "info" | "warn" | "error" | "debug";

const isDev = process.env.NODE_ENV === "development";

const log = (level: LogLevel, message: string, data?: unknown): void => {
  if (!isDev && level === "debug") return;

  const timestamp = new Date().toISOString();
  const prefix = `[AllServe][${timestamp}][${level.toUpperCase()}]`;

  if (level === "error") {
    console.error(prefix, message, data ?? "");
  } else if (level === "warn") {
    console.warn(prefix, message, data ?? "");
  } else {
    console.log(prefix, message, data ?? "");
  }
};

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
  debug: (message: string, data?: unknown) => log("debug", message, data),
};