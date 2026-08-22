import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@superior-ai/core",
    "@superior-ai/ai-gateway",
    "@superior-ai/agents",
    "@superior-ai/creative",
    "@superior-ai/seo",
    "@superior-ai/sales",
    "@superior-ai/competitor",
  ],
};

export default nextConfig;
