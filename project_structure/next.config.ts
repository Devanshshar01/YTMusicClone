import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for Netlify to support API routes
  // output: "export",
  // Remove the turbopack root configuration as it's environment-specific
  // This will allow Next.js to auto-detect the workspace root
};

export default nextConfig;