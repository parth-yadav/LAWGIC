import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config: any) => {
    // Handle PDF.js worker properly for Next.js 15
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Ensure worker files are treated as assets
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]'
      }
    });
    
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
