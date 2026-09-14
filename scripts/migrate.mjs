/**
 * Turns the archived WordPress export into the new site's data.
 *
 *   archive/raw/*.json  +  archive/images/**   ->   public/media/**  +  drizzle/seed.sql
 *
 * Safe to re-run: it rewrites the derivatives and the seed file from scratch.
 */
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { EVENTS, GALLERY_SOURCES, DROPPED, ARTIST_ALIASES } from './migration-plan.mjs';

const OUT_DIR = 'public/media';
const SEED = 'data/archive-seed.sql';
const FULL_EDGE = 2400;
const THUMB_EDGE = 600;

/* -- helpers ------------------------------------------------------------- */

const decode = (s = '') =>
  s
    .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const sqlStr = (v) =>
  v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

/** Stable, readable id from the original upload path. */
const idFor = (rel) => rel.replace(/\.[a-z]+$/i, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();

const SMALL_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or',
  'the', 'to', 'up', 'with',
]);

/** Repair the handful of SHOUTED captions so the gallery reads consistently. */
function titleCase(text) {
  return text
    .toLowerCase()
    .split(' ')
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word)
        ? word
        : word.replace(/^([a-z])/, (c) => c.toUpperCase()),
    )
    .join(' ');
}

/**
 * Ten years of hand-typed captions left a lot of unbalanced quotes:
 * `"Old Truck'`, `' KAWHIA'`, `Mount Kakapuku"`, `'RICHMOND' TASMANIA`.
 * Strip the decoration without eating real apostrophes — `"Driftin'"` has to
 * come out as `Driftin'`, and `"Yarndley's Bush"` as `Yarndley's Bush`.
 */
const trim = (raw) => {
  let s = raw.trim();

  // A quote at each end wraps the whole thing, whichever kinds they are.
  const wrapped = s.match(/^["'](.+)["']$/s);
  if (wrapped) {
    s = wrapped[1];
  } else {
    s = s.replace(/^["']+\s*/, '');
    // A lone survivor is a stray opener or closer, not an apostrophe.
    if ((s.match(/"/g) ?? []).length === 1) s = s.replace(/"/g, '');
    if ((s.match(/'/g) ?? []).length === 1) s = s.replace(/'(\s|$)/, '$1');
  }

  return s.replace(/^[\s]+/, '').replace(/[\s.,]+$/, '').trim();
};

const isShouted = (s) => s === s.toUpperCase() && /[A-Z]{3}/.test(s);

/** Looks like a person's name rather than the name of a work. */
const NAME = /^[A-Z][a-z'’-]+(?: [A-Z][a-z'’-]*\.?){1,2}$/;

/**
 * Ten years of captions written by different people, in every style:
 *
 *   By Pip Annan                                    -> artist only
 *   "Yarndley's Bush" by Sharon Ramsay              -> title + artist
 *   Ngaire Lincoln's "Old Truck'                    -> possessive, quotes unbalanced
 *   Gretchen Garvey with " Babe in Arms" sculpture. -> artist "with" the work
 *   Another Scupter by Gretchen Garvey - "Fantail"  -> real title trails the artist
 *   THE WINNER - 'THE BEACH' BY ANGELA GEORGE       -> award prefix, all caps
 *
 * Anything that fits none of these is kept whole as a caption rather than
 * being forced into a shape it does not have.
 */
export function parseCaption(raw) {
  let text = decode(raw)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\.$/, '')
    .trim();
  if (!text) return { title: '', artist: '' };

  // "THE WINNER - …" is a rosette, not part of the name of the work.
  let award = false;
  const winner = text.match(/^the winner\s*[-–—:]\s*(.+)$/i);
  if (winner) {
    award = true;
    text = winner[1].trim();
  }

  let title = '';
  let artist = '';

  const by = text.match(/^(.*?)\s*\bby\s+(.+)$/i);
  const possessive = text.match(/^([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*){0,2})'s\s+(.+)$/);
  const withWork = text.match(/^([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*){0,2})\s+with\s+(.+?)(?:\s+sculpture)?$/i);

  if (by) {
    title = by[1];
    artist = by[2];
  } else if (possessive) {
    artist = possessive[1];
    title = possessive[2];
  } else if (withWork) {
    artist = withWork[1];
    // Only a quoted phrase after "with" is a title; "with sold painting" is
    // describing a photograph of the artist, not naming a work.
    title = /["']/.test(withWork[2]) ? withWork[2] : '';
  } else if (NAME.test(text) || award) {
    artist = text;
  } else {
    title = text;
  }

  // `Gretchen Garvey - "Fantail"`: the quoted tail is the work, not the artist.
  const tail = artist.match(/^(.*?)\s*[-–—]\s*["'](.+?)["']?$/);
  if (tail) {
    artist = tail[1];
    title = tail[2];
  }

  title = trim(title);
  artist = trim(artist);

  if (isShouted(title)) title = titleCase(title);
  if (isShouted(artist)) artist = titleCase(artist);

  artist = ARTIST_ALIASES[artist] ?? artist;

  return { title, artist };
}

/** Pull `{ url, caption }` in document order out of a post's HTML. */
function extractFigures(html = '') {
  const figures = [];
  const seen = new Set();

  // <figure> blocks carry the captions we care about.
  for (const m of html.matchAll(/<figure[\s\S]*?<\/figure>/gi)) {
    const block = m[0];
    const src = block.match(
      /src="(https:\/\/teawamutuartcentre\.wordpress\.com\/wp-content\/uploads\/[^"?]+)/i,
    );
    if (!src) continue;
    const cap = block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    const url = src[1];
    if (seen.has(url)) continue;
    seen.add(url);
    figures.push({ url, caption: cap ? cap[1].replace(/<[^>]+>/g, ' ') : '' });
  }

  // Then any loose <img> not already picked up.
  for (const m of html.matchAll(
    /<img[^>]+src="(https:\/\/teawamutuartcentre\.wordpress\.com\/wp-content\/uploads\/[^"?]+)/gi,
  )) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    figures.push({ url: m[1], caption: '' });
  }

  return figures;
}

/* -- image processing ---------------------------------------------------- */

const processed = new Map(); // rel -> record

async function processImage(url) {
  const rel = url.split('/uploads/')[1];
  if (processed.has(rel)) return processed.get(rel);

  const source = path.join('archive/images', rel);
  if (!existsSync(source)) {
    console.warn(`  missing on disk, skipped: ${rel}`);
    return null;
  }

  const id = idFor(rel);
  const fullName = `${id}-full.webp`;
  const thumbName = `${id}-thumb.webp`;

  const full = await sharp(source)
    .rotate()
    .resize({ width: FULL_EDGE, height: FULL_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(OUT_DIR, fullName));

  await sharp(source)
    .rotate()
    .resize({ width: THUMB_EDGE, height: THUMB_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(OUT_DIR, thumbName));

  const record = {
    id,
    keyFull: `media/${fullName}`,
    keyThumb: `media/${thumbName}`,
    width: full.width,
    height: full.height,
    sourceUrl: url,
  };
  processed.set(rel, record);
  return record;
}

/* -- main ---------------------------------------------------------------- */

async function main() {
  const posts = JSON.parse(await readFile('archive/raw/posts.json', 'utf8'));
  const pages = JSON.parse(await readFile('archive/raw/pages.json', 'utf8'));

  const byId = new Map();
  for (const p of posts) byId.set(p.ID, p);
  for (const p of pages) byId.set(`page:${p.ID}`, p);

  const figuresOf = (key) => extractFigures(byId.get(key)?.content ?? '');

  /**
   * A couple of photographs were uploaded to a post but never placed in its
   * body, so they only exist in the attachments map. They are real pictures of
   * real events, so events pick them up after their in-body ones. The gallery
   * does not, because an uncaptioned orphan there would just be an untitled work.
   */
  const attachmentsOf = (key) => {
    const post = byId.get(key);
    if (!post) return [];
    const inBody = new Set(figuresOf(key).map((f) => f.url));
    return Object.values(post.attachments ?? {})
      .filter((a) => /\.(jpe?g|png|gif|webp)$/i.test(a.URL ?? ''))
      .map((a) => ({ url: a.URL.split('?')[0], caption: '' }))
      .filter((f) => !inBody.has(f.url));
  };

  // Only this script's own derivatives are cleared. Sub-folders belong to
  // other one-off imports (scripts/import-facebook.mjs) and are left alone.
  await mkdir(OUT_DIR, { recursive: true });
  for (const entry of await readdir(OUT_DIR, { withFileTypes: true })) {
    if (entry.isFile()) await rm(path.join(OUT_DIR, entry.name));
  }

  const now = Math.floor(Date.now() / 1000);
  const lines = [];
  const push = (sql) => lines.push(sql);

  push('-- Generated by scripts/migrate.mjs. Do not edit by hand.');
  push('DELETE FROM event_images;');
  push('DELETE FROM artworks;');
  push('DELETE FROM events;');
  push('DELETE FROM images;');
  push('');

  /* Events ------------------------------------------------------------- */
  const eventRows = [];
  for (const spec of EVENTS) {
    const figures = [
      ...spec.sources.flatMap(figuresOf),
      ...spec.sources.flatMap(attachmentsOf),
    ];
    const records = [];
    for (const fig of figures) {
      const rec = await processImage(fig.url);
      if (rec && !records.some((r) => r.id === rec.id)) records.push(rec);
    }
    eventRows.push({ spec, records });
    console.log(`  ${spec.kind.padEnd(10)} ${spec.slug.padEnd(42)} ${records.length} images`);
  }

  /* Gallery ------------------------------------------------------------ */
  const artworkRows = [];
  const seenArtwork = new Set();
  for (const source of GALLERY_SOURCES) {
    for (const fig of figuresOf(source)) {
      const rec = await processImage(fig.url);
      if (!rec || seenArtwork.has(rec.id)) continue;
      seenArtwork.add(rec.id);
      const { title, artist } = parseCaption(fig.caption);
      artworkRows.push({ rec, title, artist });
    }
  }

  /* Emit ---------------------------------------------------------------- */
  for (const rec of processed.values()) {
    push(
      `INSERT INTO images (id, key_full, key_thumb, width, height, alt, source_url, created_at) VALUES (` +
        `${sqlStr(rec.id)}, ${sqlStr(rec.keyFull)}, ${sqlStr(rec.keyThumb)}, ${rec.width}, ${rec.height}, '', ${sqlStr(rec.sourceUrl)}, ${now});`,
    );
  }
  push('');

  for (const { spec, records } of eventRows) {
    const cover = records[0] ? sqlStr(records[0].id) : 'NULL';
    push(
      `INSERT INTO events (id, slug, title, kind, starts_on, ends_on, location, summary, body, cover_image_id, status, created_at, updated_at) VALUES (` +
        `${sqlStr(spec.slug)}, ${sqlStr(spec.slug)}, ${sqlStr(spec.title)}, ${sqlStr(spec.kind)}, ` +
        `${sqlStr(spec.startsOn)}, ${sqlStr(spec.endsOn)}, ${sqlStr(spec.location)}, ${sqlStr(spec.summary)}, '', ` +
        `${cover}, 'published', ${now}, ${now});`,
    );
    records.forEach((rec, i) => {
      push(
        `INSERT INTO event_images (event_id, image_id, position) VALUES (${sqlStr(spec.slug)}, ${sqlStr(rec.id)}, ${i});`,
      );
    });
  }
  push('');

  artworkRows.forEach(({ rec, title, artist }, i) => {
    push(
      `INSERT INTO artworks (id, image_id, title, artist, year, medium, event_id, featured, position, status, created_at) VALUES (` +
        `${sqlStr(`art-${rec.id}`)}, ${sqlStr(rec.id)}, ${sqlStr(title)}, ${sqlStr(artist)}, NULL, NULL, NULL, 0, ${i}, 'published', ${now});`,
    );
  });

  await writeFile(SEED, lines.join('\n') + '\n');

  /* Report -------------------------------------------------------------- */
  const named = artworkRows.filter((a) => a.artist).length;
  const exhibitions = EVENTS.filter((e) => e.kind === 'exhibition').length;
  const workshops = EVENTS.filter((e) => e.kind === 'workshop').length;
  console.log(`
--- migration summary -------------------------------------
  images processed   ${processed.size}
  events             ${eventRows.length}  (${exhibitions} exhibitions, ${workshops} workshops)
  event pictures     ${eventRows.reduce((n, e) => n + e.records.length, 0)}
  artworks           ${artworkRows.length}  (${named} with an artist credited)
  posts dropped      ${Object.keys(DROPPED).length}
  seed written to    ${SEED}
-----------------------------------------------------------`);
}

// Only migrate when run directly — this module also exports parseCaption for
// scripts/test-captions.mjs, and importing it should not rebuild 260 images.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
