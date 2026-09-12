import { and, asc, count, desc, eq, sql } from 'drizzle-orm';
import { getDb } from './index';
import { artworks, eventImages, events, images } from './schema';
import { todayInNZ } from '@/lib/format';
import type { EventKind } from '@/lib/site';

export type ImageRow = typeof images.$inferSelect;
export type EventRow = typeof events.$inferSelect;

export type EventWithCover = EventRow & { cover: ImageRow | null };
export type ArtworkWithImage = typeof artworks.$inferSelect & { image: ImageRow };

const PUBLISHED = eq(events.status, 'published');

/**
 * Events, newest first, with the cover picture joined in.
 * `kind` narrows to exhibitions or workshops; omit it for everything.
 */
export async function listEvents(opts: { kind?: EventKind; limit?: number } = {}) {
  const db = getDb();
  const where = opts.kind ? and(PUBLISHED, eq(events.kind, opts.kind)) : PUBLISHED;

  const rows = await db
    .select({ event: events, cover: images })
    .from(events)
    .leftJoin(images, eq(events.coverImageId, images.id))
    .where(where)
    // Undated archive items sort last rather than jumping to the top.
    .orderBy(sql`${events.startsOn} IS NULL`, desc(events.startsOn), desc(events.createdAt))
    .limit(opts.limit ?? 200);

  return rows.map((r): EventWithCover => ({ ...r.event, cover: r.cover }));
}

/** Splits the list into what is still to come and what has already happened. */
export function partitionByDate(list: EventWithCover[]) {
  const today = todayInNZ();
  const isUpcoming = (e: EventWithCover) => {
    const end = e.endsOn ?? e.startsOn;
    return end !== null && end >= today;
  };
  return {
    upcoming: list.filter(isUpcoming).sort((a, b) => (a.startsOn ?? '').localeCompare(b.startsOn ?? '')),
    past: list.filter((e) => !isUpcoming(e)),
  };
}

export async function getEventBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select({ event: events, cover: images })
    .from(events)
    .leftJoin(images, eq(events.coverImageId, images.id))
    .where(and(eq(events.slug, slug), PUBLISHED))
    .limit(1);

  if (!row) return null;

  const gallery = await db
    .select({ image: images })
    .from(eventImages)
    .innerJoin(images, eq(eventImages.imageId, images.id))
    .where(eq(eventImages.eventId, row.event.id))
    .orderBy(asc(eventImages.position));

  return { ...row.event, cover: row.cover, images: gallery.map((g) => g.image) };
}

export async function listArtworks(
  opts: { limit?: number; artist?: string; byYear?: boolean } = {},
) {
  const db = getDb();
  const where = opts.artist
    ? and(eq(artworks.status, 'published'), eq(artworks.artist, opts.artist))
    : eq(artworks.status, 'published');

  const curated = [desc(artworks.featured), asc(artworks.position), desc(artworks.createdAt)];
  // The Gallery walks through the years newest first. Pieces with no year
  // recorded — most of what came over from the old site — sit at the end.
  const order = opts.byYear
    ? [sql`${artworks.year} IS NULL`, desc(artworks.year), ...curated]
    : curated;

  const rows = await db
    .select({ artwork: artworks, image: images })
    .from(artworks)
    .innerJoin(images, eq(artworks.imageId, images.id))
    .where(where)
    .orderBy(...order)
    .limit(opts.limit ?? 500);

  return rows.map((r): ArtworkWithImage => ({ ...r.artwork, image: r.image }));
}

/** Gallery items bucketed by year, newest first, with the undated ones last. */
export function groupByYear<T extends { year: string | null }>(items: T[]) {
  const groups: { year: string | null; items: T[] }[] = [];
  for (const item of items) {
    const year = item.year?.trim() || null;
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}

/** Distinct artist names, for the gallery's filter. */
export async function listArtists(): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .selectDistinct({ artist: artworks.artist })
    .from(artworks)
    .where(and(eq(artworks.status, 'published'), sql`${artworks.artist} <> ''`))
    .orderBy(asc(artworks.artist));
  return rows.map((r) => r.artist);
}

export async function getEventSlugs() {
  const db = getDb();
  return (await db.select({ slug: events.slug }).from(events).where(PUBLISHED)).map((r) => r.slug);
}

/* -- admin ----------------------------------------------------------------
   These deliberately ignore the `published` filter: the committee needs to see
   what it has hidden in order to put it back.                              */

export const ADMIN_PAGE_SIZE = 20;

export type Page<T> = {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
};

function paginate<T>(items: T[], total: number, page: number, size: number): Page<T> {
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / size)) };
}

export async function listEventsForAdmin(page = 1, size = ADMIN_PAGE_SIZE) {
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(events);

  const rows = await db
    .select({ event: events, cover: images, photos: count(eventImages.imageId) })
    .from(events)
    .leftJoin(images, eq(events.coverImageId, images.id))
    .leftJoin(eventImages, eq(eventImages.eventId, events.id))
    .groupBy(events.id)
    .orderBy(sql`${events.startsOn} IS NULL`, desc(events.startsOn), desc(events.createdAt))
    .limit(size)
    .offset((page - 1) * size);

  return paginate(
    rows.map((r) => ({ ...r.event, cover: r.cover, photoCount: r.photos })),
    total,
    page,
    size,
  );
}

export async function getEventForAdmin(id: string) {
  const db = getDb();
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!row) return null;

  const photos = await db
    .select({ image: images })
    .from(eventImages)
    .innerJoin(images, eq(eventImages.imageId, images.id))
    .where(eq(eventImages.eventId, id))
    .orderBy(asc(eventImages.position));

  return { ...row, images: photos.map((p) => p.image) };
}

export async function listArtworksForAdmin(page = 1, size = ADMIN_PAGE_SIZE) {
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(artworks);

  const rows = await db
    .select({ artwork: artworks, image: images })
    .from(artworks)
    .innerJoin(images, eq(artworks.imageId, images.id))
    .orderBy(desc(artworks.createdAt), asc(artworks.position))
    .limit(size)
    .offset((page - 1) * size);

  return paginate(
    rows.map((r): ArtworkWithImage => ({ ...r.artwork, image: r.image })),
    total,
    page,
    size,
  );
}

export async function getArtworkForAdmin(id: string) {
  const db = getDb();
  const [row] = await db
    .select({ artwork: artworks, image: images })
    .from(artworks)
    .innerJoin(images, eq(artworks.imageId, images.id))
    .where(eq(artworks.id, id))
    .limit(1);
  return row ? { ...row.artwork, image: row.image } : null;
}
