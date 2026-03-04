import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any, { dev }) => {
    // Handle PDF.js worker properly for Next.js 15
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // FIX: Override eval-* devtool to prevent Object.defineProperty error with pdfjs-dist 5.4+
    if (dev && config.devtool && config.devtool.includes("eval")) {
      config.devtool = "source-map"; // You can also set this to false if source maps aren't needed
    }
    
    return config;
  },
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