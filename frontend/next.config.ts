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
      {
        protocol: "https",
        hostname: `lawgic-backend-684404792129.asia-south2.run.app`,
      },
      {
        protocol: "http",
        hostname: `localhost`,
        port: "6900",
      },
    ],
  },
};

export default nextConfig;
