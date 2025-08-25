import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: `byte-us-dev-bucket.s3.ap-south-1.amazonaws.com`,
      },
    ],
  },
};

export default nextConfig;
