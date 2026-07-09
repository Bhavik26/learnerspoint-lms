import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.MOBILE_BUILD === "true" ? "export" : "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
