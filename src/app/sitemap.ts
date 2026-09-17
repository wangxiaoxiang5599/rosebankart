import type { MetadataRoute } from 'next';
import { listEvents } from '@/db/queries';
import { nav, site } from '@/lib/site';

// Built from D1 on every request, like the pages themselves, so a newly
// published event is listed without a redeploy. D1 is unreachable at build time.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await listEvents();

  const pages: MetadataRoute.Sitemap = nav.map((item) => ({
    url: `${site.url}${item.href}`,
    changeFrequency: item.href === '/' ? 'weekly' : 'monthly',
    priority: item.href === '/' ? 1 : 0.7,
  }));

  const posts: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${site.url}/events/${event.slug}`,
    lastModified: event.updatedAt,
    changeFrequency: 'yearly',
    priority: 0.5,
  }));

  return [...pages, ...posts];
}
