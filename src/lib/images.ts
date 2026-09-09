import type { images } from '@/db/schema';

type ImageRow = typeof images.$inferSelect;

/**
 * Two kinds of stored key:
 *
 *   media/…    the migrated 2020–2024 archive. Immutable historical content, so
 *              it ships as static assets and is served straight off the CDN.
 *   uploads/…  anything added through the admin since. Lives in R2, served by
 *              the /img route.
 */
export function imgUrl(key: string): string {
  return key.startsWith('media/') ? `/${key}` : `/img/${key}`;
}

/** Grid / card size (long edge 600px). */
export const thumbUrl = (image: Pick<ImageRow, 'keyThumb'>) => imgUrl(image.keyThumb);

/** Display size (long edge 1800px). */
export const fullUrl = (image: Pick<ImageRow, 'keyFull'>) => imgUrl(image.keyFull);
