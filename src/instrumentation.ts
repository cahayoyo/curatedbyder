import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { after } from "next/server";

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

export type LogAttributes = Record<string, string | number | boolean | null | undefined>;

// Single emission point for PostHog server logs (issue #223). No key
// (local/staging) -> provider has no processors -> silent no-op.
export function emitLog(
  body: string,
  attrs: LogAttributes = {},
  severity: SeverityNumber = SeverityNumber.INFO,
) {
  loggerProvider.getLogger("curatedbyder").emit({
    body,
    severityNumber: severity,
    attributes: Object.fromEntries(
      Object.entries(attrs).filter((e): e is [string, string | number | boolean | null] => e[1] !== undefined),
    ),
  });
  // Batch processor sends async; flush after the response so serverless
  // doesn't freeze before delivery. Guarded: authorize() has no request
  // store — the processor's interval flush is the fallback there.
  try {
    after(async () => {
      await loggerProvider.forceFlush();
    });
  } catch {
    // ignore
  }
}
