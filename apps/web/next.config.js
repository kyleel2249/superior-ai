/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@superior-ai/agents",
    "@superior-ai/ai-gateway",
    "@superior-ai/audit",
    "@superior-ai/auth",
    "@superior-ai/billing",
    "@superior-ai/cache",
    "@superior-ai/core",
    "@superior-ai/creative",
    "@superior-ai/crm",
    "@superior-ai/events",
    "@superior-ai/memory",
    "@superior-ai/observability",
    "@superior-ai/queue",
    "@superior-ai/shared",
    "@superior-ai/social",
    "@superior-ai/storage",
    "@superior-ai/tools",
  ],
};

module.exports = nextConfig;
