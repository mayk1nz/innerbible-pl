import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets a phone on the same Wi-Fi load the dev server.
  allowedDevOrigins: ["192.168.1.116"],
  // Old upsell addresses (may still be set in KashPay) → the current pages.
  async redirects() {
    return [
      { source: "/up1", destination: "/upsell", permanent: false },
      { source: "/up2", destination: "/slowa-pana", permanent: false },
    ];
  },
};

export default nextConfig;
