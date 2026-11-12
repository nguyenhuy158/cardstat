import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  basePath: "/spending",
  redirects: async () => [
    { source: "/", destination: "https://dash.huyab.cfd/spending", basePath: false, permanent: false },
  ],
  // @huyab/sso ships TypeScript source (git dependency, no build step).
  transpilePackages: ["@huyab/sso"],
};

initOpenNextCloudflareForDev();

export default nextConfig;
