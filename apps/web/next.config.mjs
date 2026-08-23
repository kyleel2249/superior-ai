/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages are consumed as raw TS from their src/ — no prebuild step,
  // so Next needs to transpile them itself rather than treating them as pre-built libs.
  transpilePackages: [
    "@superior-ai/core",
    "@superior-ai/ai-gateway",
    "@superior-ai/agents",
    "@superior-ai/audit",
    "@superior-ai/auth",
    "@superior-ai/billing",
    "@superior-ai/brand",
    "@superior-ai/crm",
    "@superior-ai/db",
    "@superior-ai/memory",
    "@superior-ai/observability",
    "@superior-ai/queue",
    "@superior-ai/social",
    "@superior-ai/creative",
    "@superior-ai/seo",
    "@superior-ai/marketing",
    "@superior-ai/tools",
    "@superior-ai/shared",
    "@superior-ai/intelligence",
  ],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
