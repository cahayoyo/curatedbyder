"use client";

type EventProperties = Record<string, string | number | boolean | null | undefined>;

// PostHog client SDK is disabled (hotfix #210/#211) — capture is a no-op until
// the failing /i/v0/e/ requests are root-caused and the SDK is re-introduced.
export function capture(event: string, properties?: EventProperties) {
  void event;
  void properties;
}
