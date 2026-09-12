// Sentry + PostHog client instrumentation share this ONE file: Next.js resolves
// `src/instrumentation-client` before the root `instrumentation-client`, so a
// second root file would be silently ignored (that shadowing disabled PostHog).
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

// Production-only: NEXT_PUBLIC_SENTRY_DSN is set in the Vercel Production scope.
// Local/staging leave it empty, so `enabled: false` makes the SDK a no-op that
// sends nothing to Sentry.
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// PostHog client SDK re-enabled (issue #215) via the reverse proxy
// (/ingest/* → us.i.posthog.com, issue #214) so Brave/uBlock don't
// block the event requests. The stall that got it disabled was
// cacheComponents (hotfix #212), not PostHog itself.
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!posthogKey) {
  // PostHog is intentionally disabled outside production (the key is only
  // set in the production Vercel scope). Warn instead of throwing so the
  // app still runs without it.
  if (process.env.NODE_ENV !== "production") {
    console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled.");
  }
} else if (!posthogHost) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_HOST not set — analytics disabled.");
  }
} else {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
