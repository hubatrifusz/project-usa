/**
 * Encrypts the itinerary at build time so it never ships in readable form.
 *
 * Reads the plaintext `app/data/events.ts` (which lives only in the private repo and is
 * imported by nothing at runtime) and writes `public/events.enc.json`, which is what
 * actually gets deployed. The passphrase comes from the environment and never enters
 * the bundle.
 *
 * Crypto: PBKDF2-SHA256 → AES-GCM-256, both from Node's built-in WebCrypto, mirrored
 * exactly by `app/composables/useTrip.ts` on the browser side.
 */
import { webcrypto as crypto } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'

const PBKDF2_ITERATIONS = 250_000
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function fail(message) {
  console.error(`\n[encrypt-events] ${message}\n`)
  process.exit(1)
}

/** Same derivation as the client — change one, change both. */
async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

const toBase64 = (bytes) => Buffer.from(bytes).toString('base64')

async function main() {
  // Hosts inject env vars directly; locally we read .env, which Nuxt itself won't have
  // loaded yet because this runs as its own process before the build.
  try {
    process.loadEnvFile(resolve(root, '.env'))
  } catch {
    // No .env file — fine on a host, caught below if the var is missing anyway.
  }

  const passphrase = process.env.TRIP_PASSPHRASE
  if (!passphrase) {
    fail(
      'TRIP_PASSPHRASE is not set.\n' +
        'Locally: copy .env.example to .env and set it.\n' +
        'On Vercel/Netlify: add it as a build environment variable.',
    )
  }
  if (passphrase.length < 12) {
    fail('TRIP_PASSPHRASE is too short. Use four or more random words.')
  }

  // jiti lets a plain .mjs script import the TypeScript source directly.
  const jiti = createJiti(import.meta.url)
  const { events } = await jiti.import(resolve(root, 'app/data/events.ts'))

  if (!Array.isArray(events) || events.length === 0) {
    fail('app/data/events.ts exported no events.')
  }

  const ids = new Set()
  for (const event of events) {
    if (!event.id || !event.time || !event.title?.en || !event.title?.hu) {
      fail(`Event ${JSON.stringify(event.id ?? '?')} is missing id, time, or a title.`)
    }
    if (Number.isNaN(Date.parse(event.time))) {
      fail(`Event "${event.id}" has an unparseable time: ${event.time}`)
    }
    if (ids.has(event.id)) fail(`Duplicate event id: "${event.id}"`)
    ids.add(event.id)
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(events)),
  )

  const out = resolve(root, 'public/events.enc.json')
  await mkdir(dirname(out), { recursive: true })
  await writeFile(
    out,
    JSON.stringify({
      v: 1,
      salt: toBase64(salt),
      iv: toBase64(iv),
      ct: toBase64(new Uint8Array(ciphertext)),
    }),
  )

  console.log(`[encrypt-events] ${events.length} events → public/events.enc.json`)
}

await main()
