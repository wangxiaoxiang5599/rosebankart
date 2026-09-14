# Rosebank Art Centre

Website for [Rosebank Art Centre](https://teawamutuartcentre.wordpress.com/), a
community art facility and charitable trust at 337 Churchill Street, Te Awamutu,
New Zealand.

This replaces a WordPress.com site whose administrator access was lost, leaving
it frozen since April 2024. All of the old content has been recovered and
migrated — see [Migration](#migration).

---

## Stack

| Layer     | Choice                                       |
| --------- | -------------------------------------------- |
| Framework | Next.js 15 (App Router)                      |
| Runtime   | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database  | Cloudflare D1 (SQLite) + Drizzle ORM         |
| Uploads   | Cloudflare R2                                |
| Styling   | Plain CSS Modules with tokens in `src/styles/tokens.css` |

Chosen to sit inside Cloudflare's free tier with no cold-start pause, no server
to patch, and no monthly bill. The only recurring cost is the domain.

## Running it

```bash
npm install
npx wrangler d1 migrations apply rosebankart-db --local   # create the schema
npm run migrate                                           # build public/media + the seed
npm run db:seed:local                                     # load the archive
npm run dev
```

Then create yourself a login:

```bash
node scripts/create-user.mjs you@example.com "Your Name" --local
```

## Layout

```
src/
  app/
    page.tsx              home — hero, 3 newest events, 8 recent works
    events/               listing, filter, and one page per event
    gallery/              all artwork, filterable by artist
    about/  contact/      static pages
    admin/                sign-in and the two publishing forms
    api/upload/           receives resized photos, writes to R2
    img/[...key]/         serves R2 objects
  components/             Header, Footer, Hero, cards, PhotoGrid, PhotoPicker
  db/                     Drizzle schema and queries
  lib/                    auth, site details, formatting, image URLs
scripts/
  archive-wp.mjs          pulls the old site down (already run)
  migration-plan.mjs      how old posts map onto the new structure — review this
  migrate.mjs             turns the archive into public/media + data/archive-seed.sql
  import-facebook.mjs     one-off import of the 2025–2026 Facebook pictures
  create-user.mjs         adds a committee login
archive/                  the recovered WordPress export (see below)
```

## Two kinds of image

- `media/…` — the 130 migrated pictures and the 209 Facebook ones (see
  below). Immutable, so they ship as static assets and come off the CDN.
- `uploads/…` — anything added through the admin since. Stored in R2 and served
  by `src/app/img/[...key]/route.ts`.

`imgUrl()` in `src/lib/images.ts` routes between them. Resizing happens in the
browser before upload (`src/components/PhotoPicker.tsx`), because Workers cannot
decode images without a paid add-on and because a 5 MB phone photo should not
have to cross a rural broadband connection.

Every picture is stored twice: a **2400px** long edge for display and a **600px**
thumbnail for grids. 2400 rather than something smaller because roughly half of
what gets posted is a poster or a scanned page of the newsletter — the originals
run to a median long edge of 3770px, and at 1800 the text was no longer readable
when zoomed. Photographs are mostly smaller than 2400 anyway and are never
enlarged. Keep the two constants in `scripts/migrate.mjs` and
`src/components/PhotoPicker.tsx` in step.

## Migration

`archive/raw/*.json` is the complete WordPress.com export — 25 posts, 5 pages —
pulled through the public REST API, which needs no administrator access. It is
tracked in git.

`archive/images/` holds the 130 recovered originals (167 MB). It is **not** in
git — keep a separate backup. If wordpress.com ever removes the old site these
cannot be fetched again; `archive/raw/images.json` records every source URL.

Everything on the old site was filed under "Uncategorized". The mapping onto
exhibitions, workshops and gallery pieces was made by hand and lives in
`scripts/migration-plan.mjs` — **that file is the part worth a second pair of
eyes.** Re-run the migration at any time with `npm run migrate`.

Left out on purpose:

| Source                        | Why                                            |
| ----------------------------- | ---------------------------------------------- |
| post 227                      | Empty post titled "Home"                       |
| post 75, pages 6 and 8        | Committee, fees, about — now in `src/lib/site.ts` |
| page 7                        | Contact details — now in `src/lib/site.ts`     |
| one stock Unsplash photo      | Was decoration on the old Info page            |

Duplicate posts were merged: 193+199, 354+358+370+435+431+429, 449+452, 335+260.

### The Facebook batch

The old site stopped in 2024; 2025–2026 lived on the centre's Facebook page.
Those pictures were saved by hand into `<folder>/<year>/<facebook-id>.jpg`
(not in git — 222 files, 79 MB) and imported once with

```bash
npm run import:facebook -- C:/path/to/rosebankpic   # -> public/media/facebook + data/facebook-seed.sql
npm run db:seed:facebook:local                        # or :remote after deploying
```

Every picture became a gallery piece under its year with no title or artist
— Facebook records neither — for the committee to caption or remove through
the admin. Near-duplicates (the same poster reposted at another size) are
dropped by perceptual hash. The seed only inserts, so it is safe to run on a
database that already has content; `migrate.mjs` leaves the `facebook/`
folder alone when it rebuilds its own pictures.

This was a one-off. Anything from here on goes in through the admin.

## Deploying

Not yet done — needs a Cloudflare account and a domain.

```bash
wrangler d1 create rosebankart-db     # put the id into wrangler.jsonc
wrangler r2 bucket create rosebankart-media
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy
node scripts/create-user.mjs sue@example.com "Sue Gordon" --remote
```

Give **every** committee member their own login. The old site was lost because
one person held the only account.

## Accessibility

The audience — members and visitors alike — skews older, so these are treated as
requirements rather than nice-to-haves:

- 20px body text minimum, nothing below 18px anywhere
- every interactive target at least 48px
- body text contrast about 11:1
- no icon carries meaning on its own; the menu button reads "☰ Menu"
- photo ordering uses ↑ ↓ buttons, never drag-and-drop only
- a visible focus ring on everything reachable by keyboard
- pictures open in the browser's own image view rather than a homemade one, so
  pinch-to-zoom works at any magnification — the way someone actually reads a
  poster or a page of the newsletter on a tablet
