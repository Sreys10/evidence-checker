import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker deployment (not needed for Vercel)
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
};

export default nextConfig;
