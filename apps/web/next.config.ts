import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@daily-puzzle/puzzle-core", "@daily-puzzle/db"],
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
