import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';

/* -- Accounts --------------------------------------------------------------
   Several committee members hold logins on purpose: the old site died because
   it had exactly one administrator and that access was lost.                */

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

/* -- Images ----------------------------------------------------------------
   One upload = one row = two R2 objects (a display size and a grid size).
   Shared by events and artworks so a photo is only ever uploaded once.      */

export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  keyFull: text('key_full').notNull(),
  keyThumb: text('key_thumb').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  alt: text('alt').notNull().default(''),
  /** Original wordpress.com path, for tracing migrated content back. */
  sourceUrl: text('source_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/* -- Events ---------------------------------------------------------------- */

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    /** 'exhibition' | 'workshop' */
    kind: text('kind').notNull(),
    /** ISO yyyy-mm-dd. Null for archive items whose date was never recorded. */
    startsOn: text('starts_on'),
    endsOn: text('ends_on'),
    location: text('location'),
    summary: text('summary').notNull().default(''),
    body: text('body').notNull().default(''),
    coverImageId: text('cover_image_id').references(() => images.id),
    /** 'published' | 'draft' — deletes are soft, nothing is ever really lost. */
    status: text('status').notNull().default('published'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [
    index('events_kind_idx').on(t.kind),
    index('events_starts_idx').on(t.startsOn),
    index('events_status_idx').on(t.status),
  ],
);

export const eventImages = sqliteTable(
  'event_images',
  {
    eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
    imageId: text('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.imageId] })],
);

/* -- Artworks (the Gallery) ------------------------------------------------ */

export const artworks = sqliteTable(
  'artworks',
  {
    id: text('id').primaryKey(),
    imageId: text('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default(''),
    artist: text('artist').notNull().default(''),
    year: text('year'),
    medium: text('medium'),
    /** Optional link back to the show the piece appeared in. */
    eventId: text('event_id').references(() => events.id, { onDelete: 'set null' }),
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
    position: integer('position').notNull().default(0),
    status: text('status').notNull().default('published'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [
    index('artworks_artist_idx').on(t.artist),
    index('artworks_status_idx').on(t.status),
  ],
);
