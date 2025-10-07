/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Fix workspace root detection issue
  turbopack: {
    root: "/Users/sharma.shruti@zomato.com/projects/yt-music-app",
  },
};

export default nextConfig;