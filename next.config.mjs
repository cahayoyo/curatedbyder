import { withPostHogConfig } from "@posthog/nextjs-config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // cacheComponents disabled (hotfix #212): server action responses stall
  // (eternal submit spinner on order creation) with it enabled; re-enable
  // only after root-causing. reactCompiler also disabled pending investigation.
  cacheComponents: false,
  reactCompiler: false,
  async rewrites() {
    return [
      // Reverse proxy for PostHog (issue #214): browser requests go to our own
      // domain (/ingest/*) so Brave/uBlock don't block them as third-party.
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.utfs.io",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
    ],
  },
};

const postHogApiKey = process.env.POSTHOG_API_KEY;
const postHogProjectId = process.env.POSTHOG_PROJECT_ID;
const postHogSourceMapsEnabled = Boolean(postHogApiKey && postHogProjectId);

if (!postHogSourceMapsEnabled && process.env.NODE_ENV !== "production") {
  const missingVariable = postHogApiKey
    ? "POSTHOG_PROJECT_ID"
    : "POSTHOG_API_KEY";
  console.error(
    new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    ),
  );
}

export default withPostHogConfig(nextConfig, {
  personalApiKey: postHogApiKey,
  projectId: postHogProjectId,
  host: process.env.POSTHOG_HOST,
  sourcemaps: {
    enabled: postHogSourceMapsEnabled,
    deleteAfterUpload: true,
  },
});