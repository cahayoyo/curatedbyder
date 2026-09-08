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

export default nextConfig;