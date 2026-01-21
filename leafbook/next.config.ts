import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable caching with cache tags
  cacheComponents: true,

  // Allow remote images from Vercel Blob Storage and Wikimedia Commons
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
