import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react", "@react-three/drei"],
    serverActions: { bodySizeLimit: "500mb" },
  },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
