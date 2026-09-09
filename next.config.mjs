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

// Source map upload for PostHog Error Tracking. Enabled only when both env
// vars exist (they are set on Vercel, empty locally) because resolveConfig
// throws when sourcemaps are enabled without credentials.
export default withPostHogConfig(nextConfig, {
  personalApiKey: process.env.POSTHOG_API_KEY, // Personal API key (error tracking write)
  projectId: process.env.POSTHOG_PROJECT_ID,
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST, // defaults to https://us.i.posthog.com
  sourcemaps: {
    enabled: Boolean(process.env.POSTHOG_API_KEY && process.env.POSTHOG_PROJECT_ID),
  },
});