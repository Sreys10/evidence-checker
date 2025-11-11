import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker deployment
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  // Ensure Python model files are included
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./model/**/*'],
    },
  },
};

export default nextConfig;
