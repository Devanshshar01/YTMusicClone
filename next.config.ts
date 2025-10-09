import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export configuration to allow API routes to work
  // output: "export",
  // Configure images for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;