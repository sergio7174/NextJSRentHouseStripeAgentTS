// instrumentation.ts (at Next.js project root)
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { getNodeAutoInstrumentations } = await import(
    "@opentelemetry/auto-instrumentations-node"
  );
  const { OTLPTraceExporter } = await import(
    "@opentelemetry/exporter-trace-otlp-http"
  );
  const { resourceFromAttributes } = await import(
    "@opentelemetry/resources"
  );
  const { ATTR_SERVICE_NAME } = await import(
    "@opentelemetry/semantic-conventions"
  );

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME || "nexthouserenting-frontend",
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
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
}