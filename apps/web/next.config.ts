import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@superior-ai/core",
    "@superior-ai/ai-gateway",
    "@superior-ai/agents",
  ],
  experimental: {
    // serverActions: true already default
  },
};

export default nextConfig;
