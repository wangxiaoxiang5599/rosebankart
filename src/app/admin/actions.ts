'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { artworks, eventImages, events } from '@/db/schema';
import { destroySession, getSessionUser, signIn } from '@/lib/auth';
import { slugify } from '@/lib/format';
import { EVENT_KINDS } from '@/lib/site';

export type FormState = { error?: string; ok?: string; slug?: string };

/* -- sign in / out --------------------------------------------------------- */

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Please fill in both boxes.' };

  const user = await signIn(email, password);
  if (!user) return { error: 'That email address and password did not match. Please try again.' };

  redirect('/admin');
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect('/admin');
}

/* -- publishing ------------------------------------------------------------ */

/** Slugs must be unique; add -2, -3 … rather than failing in front of the user. */
async function uniqueSlug(base: string): Promise<string> {
  const db = getDb();
  let slug = base;
  for (let n = 2; ; n++) {
    const [clash] = await db
      .select({ slug: events.slug })
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);
    if (!clash) return slug;
    slug = `${base}-${n}`;
  }
}

export async function createEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in again.' };

  const title = String(formData.get('title') ?? '').trim();
  const kind = String(formData.get('kind') ?? '');
  const startsOn = String(formData.get('startsOn') ?? '').trim() || null;
  const endsOn = String(formData.get('endsOn') ?? '').trim() || null;
  const location = String(formData.get('location') ?? '').trim() || null;
  const summary = String(formData.get('summary') ?? '').trim();
  const imageIds = String(formData.get('imageIds') ?? '').split(',').filter(Boolean);
  const alsoGallery = formData.get('alsoGallery') === 'on';

  if (!title) return { error: 'Please give the event a name.' };
  if (!(kind in EVENT_KINDS)) return { error: 'Please choose Exhibition or Workshop.' };
  if (endsOn && startsOn && endsOn < startsOn) {
    return { error: 'The finish date is before the start date. Please check the dates.' };
  }

  const db = getDb();
  const slug = await uniqueSlug(slugify(title));
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(events).values({
    id,
    slug,
    title,
    kind,
    startsOn,
    endsOn,
    location,
    summary,
    body: '',
    coverImageId: imageIds[0] ?? null,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  });

  if (imageIds.length > 0) {
    await db
      .insert(eventImages)
      .values(imageIds.map((imageId, position) => ({ eventId: id, imageId, position })));

    if (alsoGallery) {
      await db.insert(artworks).values(
        imageIds.map((imageId, position) => ({
          id: crypto.randomUUID(),
          imageId,
          title: '',
          artist: '',
          year: null,
          medium: null,
          eventId: id,
          featured: false,
          position,
          status: 'published',
          createdAt: now,
        })),
      );
    }
  }

  revalidatePath('/');
  revalidatePath('/events');
  if (alsoGallery) revalidatePath('/gallery');

  return { ok: `"${title}" is now on the website.`, slug };
}

export async function createArtworksAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in again.' };

  const imageIds = String(formData.get('imageIds') ?? '').split(',').filter(Boolean);
  if (imageIds.length === 0) return { error: 'Please choose at least one photo.' };

  const now = new Date();
  await getDb().insert(artworks).values(
    imageIds.map((imageId, position) => ({
      id: crypto.randomUUID(),
      imageId,
      title: String(formData.get(`title-${imageId}`) ?? '').trim(),
      artist: String(formData.get(`artist-${imageId}`) ?? '').trim(),
      year: String(formData.get(`year-${imageId}`) ?? '').trim() || null,
      medium: null,
      eventId: null,
      featured: false,
      position,
      status: 'published',
      createdAt: now,
    })),
  );

  revalidatePath('/');
  revalidatePath('/gallery');

  const n = imageIds.length;
  return { ok: `${n} ${n === 1 ? 'picture is' : 'pictures are'} now in the gallery.` };
}

/* -- editing and hiding ----------------------------------------------------
   Nothing is ever really deleted. "Delete" sets the status to `hidden`, which
   takes it off the website but leaves it in the admin so it can be put back.
   The committee guide promises exactly this, and older users are much more
   willing to tidy up when a mistake is recoverable.                        */

async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not signed in');
  return user;
}

export async function updateEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in again.' };

  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const kind = String(formData.get('kind') ?? '');
  const startsOn = String(formData.get('startsOn') ?? '').trim() || null;
  const endsOn = String(formData.get('endsOn') ?? '').trim() || null;
  const location = String(formData.get('location') ?? '').trim() || null;
  const summary = String(formData.get('summary') ?? '').trim();
  const imageIds = String(formData.get('imageIds') ?? '').split(',').filter(Boolean);

  if (!id) return { error: 'That event could not be found.' };
  if (!title) return { error: 'Please give the event a name.' };
  if (!(kind in EVENT_KINDS)) return { error: 'Please choose Exhibition or Workshop.' };
  if (endsOn && startsOn && endsOn < startsOn) {
    return { error: 'The finish date is before the start date. Please check the dates.' };
  }

  const db = getDb();
  const [existing] = await db.select({ slug: events.slug }).from(events).where(eq(events.id, id)).limit(1);
  if (!existing) return { error: 'That event could not be found.' };

  await db
    .update(events)
    .set({
      title,
      kind,
      startsOn,
      endsOn,
      location,
      summary,
      coverImageId: imageIds[0] ?? null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));

  // Rewrite the picture list wholesale: it is a short list and this keeps the
  // ordering the committee chose without diffing.
  await db.delete(eventImages).where(eq(eventImages.eventId, id));
  if (imageIds.length > 0) {
    await db
      .insert(eventImages)
      .values(imageIds.map((imageId, position) => ({ eventId: id, imageId, position })));
  }

  revalidatePath('/');
  revalidatePath('/events');
  revalidatePath(`/events/${existing.slug}`);

  return { ok: `"${title}" has been updated.`, slug: existing.slug };
}

export async function setEventVisibilityAction(id: string, hidden: boolean): Promise<void> {
  await requireUser();
  await getDb()
    .update(events)
    .set({ status: hidden ? 'hidden' : 'published', updatedAt: new Date() })
    .where(eq(events.id, id));

  revalidatePath('/');
  revalidatePath('/events');
  revalidatePath('/admin/events');
}

export async function updateArtworkAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: 'Please sign in again.' };

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'That picture could not be found.' };

  await getDb()
    .update(artworks)
    .set({
      title: String(formData.get('title') ?? '').trim(),
      artist: String(formData.get('artist') ?? '').trim(),
      year: String(formData.get('year') ?? '').trim() || null,
    })
    .where(eq(artworks.id, id));

  revalidatePath('/');
  revalidatePath('/gallery');
  revalidatePath('/admin/artworks');

  return { ok: 'The details have been saved.' };
}

export async function setArtworkVisibilityAction(id: string, hidden: boolean): Promise<void> {
  await requireUser();
  await getDb()
    .update(artworks)
    .set({ status: hidden ? 'hidden' : 'published' })
    .where(eq(artworks.id, id));

  revalidatePath('/');
  revalidatePath('/gallery');
  revalidatePath('/admin/artworks');
}
