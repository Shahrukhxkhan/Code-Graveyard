/** @type {import('next').NextConfig} */

let withSentryConfig;
try {
  withSentryConfig = require("@sentry/nextjs").withSentryConfig;
} catch {
  // Fallback wrapper if @sentry/nextjs is not installed in local node_modules yet
  withSentryConfig = (config) => config;
}

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

const userSentryOptions = {
  silent: true,
  org: process.env.SENTRY_ORG || "code-graveyard",
  project: process.env.SENTRY_PROJECT || "code-graveyard",
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

module.exports = withSentryConfig(nextConfig, userSentryOptions);
