import type { VacationEvent } from '~/data/events'

/** Envelope written by `scripts/encrypt-events.mjs`. */
interface Payload {
  v: number
  salt: string
  iv: string
  ct: string
}

/** Must match `scripts/encrypt-events.mjs` — change one, change both. */
const PBKDF2_ITERATIONS = 250_000

const PAYLOAD_URL = '/events.enc.json'
const POLL_INTERVAL = 60_000

const STORAGE_PASSPHRASE = 'trip:passphrase'
const STORAGE_PAYLOAD = 'trip:payload'

const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0))

/**
 * Loads the encrypted itinerary, unlocks it with the family passphrase, and keeps it
 * fresh. Shared across components via `useState`, so the gate and the timeline see the
 * same thing.
 */
/**
 * `checking` is the state that matters for feel: on a reload we already have a saved
 * session, but proving it takes a moment (250k PBKDF2 rounds). Starting in `locked`
 * would flash the passphrase screen at someone who is already signed in.
 */
export type TripStatus = 'checking' | 'locked' | 'unlocked'

export function useTrip() {
  const events = useState<VacationEvent[]>('trip:events', () => [])
  const status = useState<TripStatus>('trip:status', () => 'checking')
  const error = useState<string | null>('trip:error', () => null)
  const updated = useState('trip:updated', () => false)

  // Deriving a key costs ~250k PBKDF2 rounds, so cache it per salt. The salt only
  // changes when a new build is deployed.
  const keyCache = useState<{ salt: string; key: CryptoKey } | null>('trip:key', () => null)

  async function deriveKey(passphrase: string, salt: Uint8Array) {
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
      ['decrypt'],
    )
  }

  /** Throws if the passphrase is wrong — AES-GCM authenticates, so it cannot half-work. */
  async function decrypt(payload: Payload, passphrase: string): Promise<VacationEvent[]> {
    let key = keyCache.value?.salt === payload.salt ? keyCache.value.key : null
    if (!key) {
      key = await deriveKey(passphrase, fromBase64(payload.salt))
      keyCache.value = { salt: payload.salt, key }
    }

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(payload.iv) },
      key,
      fromBase64(payload.ct),
    )
    return JSON.parse(new TextDecoder().decode(plaintext))
  }

  /** Cache-busted so a CDN can never hand back yesterday's plan. */
  async function fetchPayload(): Promise<Payload> {
    return await $fetch<Payload>(PAYLOAD_URL, {
      query: { t: Date.now() },
      cache: 'no-store',
    })
  }

  function apply(next: VacationEvent[], announce: boolean) {
    const changed = JSON.stringify(next) !== JSON.stringify(events.value)
    if (!changed) return
    if (announce && events.value.length) updated.value = true
    events.value = next
  }

  /**
   * Browsers only expose `crypto.subtle` in a secure context — https, or localhost. Opened
   * over plain http at a LAN address (a phone pointed at a dev machine) it is simply
   * missing, and every unlock would otherwise look like a typo'd passphrase.
   */
  const canDecrypt = () => Boolean(globalThis.crypto?.subtle)

  /** Called from the gate. Resolves to false and sets `error` on any failure. */
  async function unlock(passphrase: string) {
    error.value = null

    if (!canDecrypt()) {
      error.value = 'insecureContext'
      return false
    }

    let payload: Payload
    try {
      payload = await fetchPayload()
    } catch {
      error.value = 'offline'
      return false
    }

    try {
      apply(await decrypt(payload, passphrase), false)
      localStorage.setItem(STORAGE_PASSPHRASE, passphrase)
      localStorage.setItem(STORAGE_PAYLOAD, JSON.stringify(payload))
      status.value = 'unlocked'
      return true
    } catch {
      keyCache.value = null
      error.value = 'wrongPassphrase'
      return false
    }
  }

  function lock() {
    localStorage.removeItem(STORAGE_PASSPHRASE)
    localStorage.removeItem(STORAGE_PAYLOAD)
    keyCache.value = null
    events.value = []
    status.value = 'locked'
  }

  /**
   * Re-check for a newer plan. A failed *download* is normal abroad and is ignored, but a
   * failed *decrypt* means the passphrase was rotated in a new build — so send them back to
   * the gate rather than leaving them staring at a plan that silently stopped updating.
   */
  async function refresh() {
    const passphrase = localStorage.getItem(STORAGE_PASSPHRASE)
    if (!passphrase || status.value !== 'unlocked') return

    let payload: Payload
    try {
      payload = await fetchPayload()
    } catch {
      return // Offline, or a deploy is mid-flight. Keep showing what we have.
    }

    try {
      apply(await decrypt(payload, passphrase), true)
      localStorage.setItem(STORAGE_PAYLOAD, JSON.stringify(payload))
    } catch {
      lock()
      error.value = 'wrongPassphrase'
    }
  }

  /**
   * Restore from the last download so the app opens instantly and still works with no
   * signal. Only the ciphertext is stored — never the decrypted plan.
   */
  async function restore() {
    if (!canDecrypt()) {
      error.value = 'insecureContext'
      status.value = 'locked'
      return
    }

    const passphrase = localStorage.getItem(STORAGE_PASSPHRASE)
    const cached = localStorage.getItem(STORAGE_PAYLOAD)
    if (!passphrase || !cached) {
      status.value = 'locked'
      return
    }

    try {
      apply(await decrypt(JSON.parse(cached), passphrase), false)
      status.value = 'unlocked'
    } catch {
      // Saved session no longer valid (e.g. passphrase rotated). Back to the gate.
      lock()
      return
    }
    // Signed in from cache already; check for a newer plan in the background.
    refresh()
  }

  return { events, status, error, updated, unlock, lock, refresh, restore, POLL_INTERVAL }
}
