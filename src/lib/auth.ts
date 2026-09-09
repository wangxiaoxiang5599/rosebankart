import { cookies } from 'next/headers';
import { eq, lt } from 'drizzle-orm';
import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';

const COOKIE = 'rbac_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 210_000; // OWASP guidance for PBKDF2-HMAC-SHA512

/* -- password hashing ------------------------------------------------------
   bcrypt and argon2 are native modules and cannot run on Workers, so this uses
   PBKDF2 from WebCrypto, which is available in every runtime we target.
   Stored as: pbkdf2$<iterations>$<salt-b64>$<hash-b64>                      */

const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-512' },
    key,
    512,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt.buffer as ArrayBuffer)}$${toB64(bits)}`;
}

/** Constant-time compare, so a wrong password cannot be found byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const bits = await derive(password, fromB64(salt), Number(iterations));
  return timingSafeEqual(toB64(bits), hash);
}

/* -- sessions -------------------------------------------------------------- */

export type SessionUser = { id: string; name: string; email: string };

export async function createSession(userId: string): Promise<void> {
  const db = getDb();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await db.insert(sessions).values({ id, userId, expiresAt });
  // Opportunistic tidy-up; there is no cron on this project to do it.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await getDb().delete(sessions).where(eq(sessions.id, id));
  jar.delete(COOKIE);
}

/** The signed-in committee member, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;

  const [row] = await getDb()
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);

  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return { id: row.user.id, name: row.user.name, email: row.user.email };
}

export async function signIn(email: string, password: string): Promise<SessionUser | null> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  // Hash even when the address is unknown, so a missing account and a wrong
  // password take the same amount of time to answer.
  const stored = user?.passwordHash ?? `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(new Uint8Array(16).buffer)}$x`;
  const ok = await verifyPassword(password, stored);

  if (!user || !ok) return null;
  await createSession(user.id);
  return { id: user.id, name: user.name, email: user.email };
}
