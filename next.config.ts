import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"], // এখানে -min যুক্ত করা হয়েছে
};

export default nextConfig;