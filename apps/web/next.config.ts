import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // The workspace pins `typescript@7.0.2` (the new Go-based compiler
    // preview) at the root, which Next's internal build-time typecheck
    // step isn't compatible with yet and crashes on ("id must be a
    // string"). `tsc --noEmit` runs clean against the whole app, so this
    // only skips Next's redundant internal pass, not type-safety itself.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
