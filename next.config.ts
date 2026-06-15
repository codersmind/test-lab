import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  register: false,
  disable: process.env.NODE_ENV === "development",
  globPublicPatterns: ["**/*.{svg,png,ico}"],
});

const nextConfig: NextConfig = {
  serverExternalPackages: ["mailparser"],
};

export default withSerwist(nextConfig);
