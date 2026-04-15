import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental শব্দটা বাদ দিয়ে সরাসরি serverExternalPackages লিখতে হবে
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;