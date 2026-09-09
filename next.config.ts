import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  // Lets a production build run without fighting a dev server over .next.
  // They share the directory otherwise, which corrupts both and forces a hard
  // kill of the dev process — which in turn leaves the local D1 database
  // holding a stale lock. Set NEXT_DIST_DIR when building alongside dev.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    // Images are served from static assets or straight out of R2; Next's
    // optimizer is unavailable on Workers and we already ship sized variants.
    unoptimized: true,
  },
};

// Makes the D1 and R2 bindings from wrangler.jsonc available to `next dev`.
initOpenNextCloudflareForDev();

export default nextConfig;
