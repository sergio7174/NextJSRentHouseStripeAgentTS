// nexthouserentingDeepAgentTSBETS\backend\logger.ts
import pino from "pino";
import { trace, context } from "@opentelemetry/api";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  mixin() {
    const activeSpan = trace.getSpan(context.active());
    if (!activeSpan) return {};
    const { traceId, spanId } = activeSpan.spanContext();
    return { traceId, spanId };
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['stripe-signature']",
    ],
    remove: true,
  },
  ...(process.env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});