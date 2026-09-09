// One-off: pull EVERYTHING off the old WordPress.com site before it can disappear.
// Public REST API — no admin credentials needed (which is the whole point: we lost them).
import { writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const SITE = 'teawamutuartcentre.wordpress.com';
const API = `https://public-api.wordpress.com/rest/v1.1/sites/${SITE}`;
const ROOT = path.resolve('archive');
const UPLOAD_RX = /https:\/\/teawamutuartcentre\.wordpress\.com\/wp-content\/uploads\/[^\s"'\)]+?\.(?:jpg|jpeg|png|gif|webp)/gi;

const j = async (u) => {
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${r.status} ${u}`);
  return r.json();
};

async function main() {
  const site = await j(API);
  const posts = (await j(`${API}/posts/?number=100`)).posts;
  const pages = (await j(`${API}/posts/?type=page&number=100`)).posts;
  console.log(`site="${site.name}"  posts=${posts.length}  pages=${pages.length}`);

  await mkdir(`${ROOT}/raw`, { recursive: true });
  await writeFile(`${ROOT}/raw/site.json`, JSON.stringify(site, null, 2));
  await writeFile(`${ROOT}/raw/posts.json`, JSON.stringify(posts, null, 2));
  await writeFile(`${ROOT}/raw/pages.json`, JSON.stringify(pages, null, 2));

  // Collect every distinct image: inline <img src>, srcset, and the attachments map.
  const urls = new Set();
  for (const p of [...posts, ...pages]) {
    for (const m of (p.content || '').matchAll(UPLOAD_RX)) urls.add(m[0].split('?')[0]);
    for (const a of Object.values(p.attachments || {})) {
      if (/\.(jpe?g|png|gif|webp)$/i.test(a.URL || '')) urls.add(a.URL.split('?')[0]);
    }
  }
  const list = [...urls].sort();
  console.log(`distinct images: ${list.length}`);

  const manifest = [];
  let ok = 0, fail = 0;
  for (const url of list) {
    const rel = url.split('/uploads/')[1];              // e.g. 2021/02/rosebank-...jpg
    const dest = path.join(ROOT, 'images', rel);
    await mkdir(path.dirname(dest), { recursive: true });
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await pipeline(r.body, createWriteStream(dest));
      const size = Number(r.headers.get('content-length') || 0);
      manifest.push({ rel, url, bytes: size });
      ok++;
      process.stdout.write(`\r  downloaded ${ok}/${list.length}`);
    } catch (e) {
      fail++;
      manifest.push({ rel, url, error: String(e.message) });
      console.error(`\n  FAIL ${rel}: ${e.message}`);
    }
  }
  await writeFile(`${ROOT}/raw/images.json`, JSON.stringify(manifest, null, 2));
  const mb = manifest.reduce((s, m) => s + (m.bytes || 0), 0) / 1024 / 1024;
  console.log(`\n\nDONE  ok=${ok}  fail=${fail}  total=${mb.toFixed(1)} MB`);
  if (fail) process.exitCode = 1;
}
main();
