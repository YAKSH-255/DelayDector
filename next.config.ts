import type { NextConfig } from "next";

/**
 * GITHUB_PAGES=true switches the build to a static export served from a
 * project subpath. Local `npm run dev` stays a normal Next server at the root.
 */
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "/DelayDector";

const nextConfig: NextConfig = {
  ...(isPages
    ? {
        output: "export",
        basePath: repo,
        trailingSlash: true,
      }
    : {}),
  images: { unoptimized: true },
};

export default nextConfig;
