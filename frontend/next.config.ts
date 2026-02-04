import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile react-pdf and pdfjs-dist to handle ES module issues
  transpilePackages: ['react-pdf'],
  
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Handle PDF.js worker properly for Next.js 15
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Ensure .mjs files are handled correctly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
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
