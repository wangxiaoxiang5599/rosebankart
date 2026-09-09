import { getMedia } from '@/db';


// R2 is only reachable at request time, never during the build.
export const dynamic = 'force-dynamic';

/**
 * Serves uploaded images straight out of R2.
 *
 * Keys are unique per upload and every stored object is immutable, so these can
 * be cached hard and forever. Replacing a picture writes a new key.
 *
 * The headers are built by hand rather than with `object.writeHttpMetadata()`:
 * in `next dev` the R2 object is a proxy across the miniflare boundary, and
 * handing it a Headers instance to fill in cannot be serialised.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const object = await getMedia().get(key.join('/'));

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body as unknown as BodyInit, {
    headers: {
      'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
      etag: object.httpEtag,
    },
  });
}
