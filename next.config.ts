import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets a phone on the same Wi-Fi load the dev server.
  allowedDevOrigins: ["192.168.1.116"],
};

export default nextConfig;
