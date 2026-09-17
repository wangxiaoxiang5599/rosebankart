import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

// Overrides the placeholder Cloudflare serves by default, which names no
// sitemap and lets crawlers into the committee's admin pages.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
