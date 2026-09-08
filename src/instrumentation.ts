import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";

const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const postHogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

// No key (local/staging) -> provider without processors: emits are silent no-ops.
export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ "service.name": "curatedbyder" }),
  processors: postHogKey
    ? [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${postHogHost}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${postHogKey}`,
              "Content-Type": "application/json",
            },
          }),
        }),
      ]
    : [],
});

// Create the provider outside register() so route handlers / server actions
// can import it and forceFlush() before the serverless function freezes.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    logs.setGlobalLoggerProvider(loggerProvider);
  }
}
