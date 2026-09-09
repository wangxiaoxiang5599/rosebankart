declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
    /** Random string used to sign session cookies. Set via `wrangler secret put`. */
    SESSION_SECRET: string;
  }
}

export {};
