/**
 * Creates a committee login.
 *
 *   node scripts/create-user.mjs sue@example.com "Sue Gordon" --local
 *   node scripts/create-user.mjs sue@example.com "Sue Gordon" --remote
 *
 * The password is typed at the prompt rather than passed as an argument, so it
 * does not end up in the shell history or in `ps` output.
 *
 * Give every committee member their own login. The old site was lost because
 * one person held the only account.
 */
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { webcrypto as crypto } from 'node:crypto';

const PBKDF2_ITERATIONS = 100_000;

const toB64 = (buf) => Buffer.from(new Uint8Array(buf)).toString('base64');

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-512' },
    key,
    512,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
}

/** Read without echoing to the terminal. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const output = rl.output;
    let muted = false;
    output.write(question);
    rl._writeToOutput = (chunk) => {
      if (!muted) output.write(chunk);
    };
    muted = true;
    rl.question('', (answer) => {
      output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const [email, name, target = '--local'] = process.argv.slice(2);

  if (!email || !name) {
    console.error('Usage: node scripts/create-user.mjs <email> "<full name>" [--local|--remote]');
    process.exit(1);
  }
  if (!['--local', '--remote'].includes(target)) {
    console.error(`Unknown target "${target}" — use --local or --remote.`);
    process.exit(1);
  }

  const password = await askHidden('Choose a password (at least 10 characters): ');
  if (password.length < 10) {
    console.error('That password is too short. Please use at least 10 characters.');
    process.exit(1);
  }
  const again = await askHidden('Type it once more: ');
  if (password !== again) {
    console.error('The two passwords did not match.');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const esc = (v) => String(v).replace(/'/g, "''");

  const sql =
    `INSERT INTO users (id, email, name, password_hash, created_at) VALUES ` +
    `('${id}', '${esc(email.trim().toLowerCase())}', '${esc(name)}', '${hash}', ${now});`;

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['wrangler', 'd1', 'execute', 'rosebankart-db', target, `--command=${sql}`],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`\nLogin created for ${name} <${email}> on the ${target.slice(2)} database.`);
}

main();
