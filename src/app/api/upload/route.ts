import { getDb, getMedia } from '@/db';
import { images } from '@/db/schema';
import { getSessionUser } from '@/lib/auth';

const MAX_BYTES = 8 * 1024 * 1024; // generous: the browser has already resized
const ALLOWED = new Set(['image/webp', 'image/jpeg', 'image/png']);

/**
 * Receives the two sizes the browser produced for one photograph and stores
 * them in R2. Resizing happens client-side because Workers cannot decode images
 * without a paid service, and it also means a 5 MB phone photo never has to
 * travel over a rural broadband connection.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const form = await request.formData();
  const full = form.get('full');
  const thumb = form.get('thumb');
  const width = Number(form.get('width'));
  const height = Number(form.get('height'));
  const alt = String(form.get('alt') ?? '');

  if (!(full instanceof File) || !(thumb instanceof File)) {
    return Response.json({ error: 'Both sizes are required' }, { status: 400 });
  }
  if (!ALLOWED.has(full.type) || !ALLOWED.has(thumb.type)) {
    return Response.json({ error: 'That file is not a photo we can use' }, { status: 415 });
  }
  if (full.size > MAX_BYTES || thumb.size > MAX_BYTES) {
    return Response.json({ error: 'That photo is too large' }, { status: 413 });
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return Response.json({ error: 'Missing image dimensions' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const ext = full.type === 'image/webp' ? 'webp' : full.type === 'image/png' ? 'png' : 'jpg';
  const keyFull = `uploads/${id}-full.${ext}`;
  const keyThumb = `uploads/${id}-thumb.${ext}`;

  const media = getMedia();
  await Promise.all([
    media.put(keyFull, await full.arrayBuffer(), { httpMetadata: { contentType: full.type } }),
    media.put(keyThumb, await thumb.arrayBuffer(), { httpMetadata: { contentType: thumb.type } }),
  ]);

  await getDb().insert(images).values({
    id,
    keyFull,
    keyThumb,
    width: Math.round(width),
    height: Math.round(height),
    alt,
    sourceUrl: null,
    createdAt: new Date(),
  });

  return Response.json({ id, keyThumb, width, height });
}
