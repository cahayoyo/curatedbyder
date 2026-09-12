import { withSentryConfig } from "@sentry/nextjs/config";
import { withPostHogConfig } from "@posthog/nextjs-config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // cacheComponents disabled (hotfix #212): server action responses stall
  // (eternal submit spinner on order creation) with it enabled; re-enable
  // only after root-causing. reactCompiler also disabled pending investigation.
  cacheComponents: false,
  reactCompiler: false,
  // Don't advertise the stack in responses.
  poweredByHeader: false,
  // Prisma runs engine-free (engineType "client" + Neon adapter); nft still
  // traces unused edge engine/compiler wasm variants into every function.
  outputFileTracingExcludes: {
    "/*": [
      "node_modules/@prisma/client/runtime/query_engine_bg.*",
      "node_modules/@prisma/client/runtime/query_compiler_bg.*",
      "node_modules/.prisma/client/query_engine*",
    ],
  },
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
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

// withPostHogConfig MUST be the outermost wrapper. Both wrappers register a
// `compiler.runAfterProductionCompile` hook; Sentry chains the existing hook, so
// when PostHog is inner it runs first and deletes every source map after
// uploading, leaving Sentry's later upload with no maps (minified stack traces).
// As the outer wrapper PostHog runs last: Sentry uploads first (maps present),
// then PostHog uploads and cleans up.
export default withPostHogConfig(withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "curatedbyder",

  project: "curatedbyder",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // PostHog (outermost) deletes the maps after both SDKs have uploaded, so keep
  // Sentry's own deletion off to avoid removing them before PostHog uploads.
  sourcemaps: {
    deleteSourcemapsAfterUpload: false,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
}), {
  personalApiKey: postHogApiKey,
  projectId: postHogProjectId,
  host: process.env.POSTHOG_HOST,
  sourcemaps: {
    enabled: postHogSourceMapsEnabled,
    deleteAfterUpload: true,
  },
});
