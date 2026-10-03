import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // @huyab/sso ships TypeScript source (git dependency, no build step).
  transpilePackages: ["@huyab/sso"],
};

initOpenNextCloudflareForDev();

export default nextConfig;
