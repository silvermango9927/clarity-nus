import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Clarity attachments POST the dropped files through the create/update
    // server action. Default body limit is 1mb; allow up to 6 files * 10mb.
    serverActions: {
      bodySizeLimit: "75mb",
    },
  },
};

export default nextConfig;
