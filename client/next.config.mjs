import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const remotePatterns = [
  {
    protocol: "http",
    hostname: "**",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**",
    pathname: "/**",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ["date-fns", "lucide-react", "@hugeicons/react"],
  },
  images: {
    remotePatterns,
    qualities: [75],
    dangerouslyAllowLocalIP: true,
    unoptimized: true,
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(withNextIntl(nextConfig));
