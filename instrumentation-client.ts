import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!posthogKey) {
  // PostHog is intentionally disabled on local dev and staging previews
  // (the key is only set in production). Warn instead of throwing so the
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
