import "dotenv/config"
import pino, { type Logger as PinoLogger, type LoggerOptions } from "pino";
import { defaultRedactPaths } from "./redact.js";
import { env } from "./env.js";

export interface CreateLoggerOptions {
    service: string;
    level?: string;
    json?: boolean;
    extraRedactPaths?: string[];
}

export function createLogger(opts: CreateLoggerOptions): PinoLogger {
    const isProd = env.NODE_ENV === "production";
    const useJson = opts.json ?? isProd;

    const config: LoggerOptions = {
        level: opts.level ?? env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
        base: { service: opts.service },
        redact: {
            paths: [...defaultRedactPaths, ...(opts.extraRedactPaths ?? [])],
            censor: "[REDACTED]",
        },
    };

    if (!useJson) {
        config.transport = {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
            },
        };
    }

    return pino(config);
}

export interface Logger {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
    debug: (msg: string, meta?: Record<string, unknown>) => void;
}

export type { PinoLogger };