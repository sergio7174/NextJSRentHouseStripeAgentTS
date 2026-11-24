
// nexthouserentingDeepAgentTSBETS\instrumentation.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "nexthouserenting-backend",
  }),
  ...(otlpEndpoint
    ? {
        traceExporter: new OTLPTraceExporter({
          url: `${otlpEndpoint.replace(/\/+$/, "")}/v1/traces`,
        }),
      }
    : {}),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy local filesystem spans during development
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .catch((err) => console.error("OTel shutdown error", err))
    .finally(() => process.exit(0));
});