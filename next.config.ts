import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server build (.next/standalone/server.js) so the app runs on
  // Azure App Service with a plain `node server.js`, no toolchain on the host.
  output: "standalone",

  // Pin the workspace root to this app so Turbopack never mis-detects it
  // from a stray parent lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
