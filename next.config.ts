import type { NextConfig } from "next";

// cacheComponents is intentionally off: it removes `export const dynamic`,
// which our (core) layout needs (see CLAUDE.md, auth flow).
const nextConfig: NextConfig = {};

export default nextConfig;
