import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gezbfcudpanniczyrntc.supabase.co",
      },
    ],
  },
};

export default nextConfig;