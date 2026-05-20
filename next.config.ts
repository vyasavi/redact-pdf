import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
  webpack: (config, { isServer }) => {
    // Prevent Webpack from trying to bundle server-side ML dependencies on the client
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": false,
        "sharp": false,
      };
    }
    // Fixes the "Critical dependency: the request of a dependency is an expression" warning
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
