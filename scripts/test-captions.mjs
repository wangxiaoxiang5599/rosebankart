/** Runs every real caption from the old site through the parser, for eyeballing. */
import { readFile } from 'node:fs/promises';
import { parseCaption } from './migrate.mjs';
import { GALLERY_SOURCES } from './migration-plan.mjs';

const posts = JSON.parse(await readFile('archive/raw/posts.json', 'utf8'));
const pages = JSON.parse(await readFile('archive/raw/pages.json', 'utf8'));
const byId = new Map();
posts.forEach((p) => byId.set(p.ID, p));
pages.forEach((p) => byId.set(`page:${p.ID}`, p));

const captions = [];
for (const source of GALLERY_SOURCES) {
  const html = byId.get(source)?.content ?? '';
  for (const m of html.matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi)) {
    const raw = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (raw) captions.push(raw);
  }
}

let withArtist = 0;
let withTitle = 0;
console.log('raw caption'.padEnd(50) + '| title'.padEnd(30) + '| artist');
console.log('-'.repeat(110));
for (const raw of captions) {
  const { title, artist } = parseCaption(raw);
  if (artist) withArtist++;
  if (title) withTitle++;
  const shown = raw.replace(/&#8216;/g, "'").replace(/&#8217;/g, "'");
  console.log(shown.slice(0, 48).padEnd(50) + `| ${title}`.slice(0, 28).padEnd(30) + `| ${artist}`);
}
console.log('-'.repeat(110));
console.log(`${captions.length} captions -> ${withTitle} titles, ${withArtist} artists`);
