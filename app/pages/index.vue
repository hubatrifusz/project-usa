<script setup lang="ts">
import type { Localized, LocaleCode, VacationEvent } from '~/data/events'

const { t, locale, locales, setLocale } = useI18n()
const toast = useToast()

// The itinerary is fetched encrypted and decrypted in the browser — see useTrip.ts.
const { events, status, updated, restore, refresh, POLL_INTERVAL } = useTrip()

/** Picks the right language out of a `Localized` field from the events file. */
const text = (field: Localized) => field[locale.value as LocaleCode] ?? field.en

/** Stays 'web' during SSR; the real platform is only known after hydration. */
const platform = ref<'ios' | 'android' | 'web'>('web')

/**
 * A navigation link for an event, or `null` when it has no place attached.
 * Each platform gets the scheme that hands off to its own default navigation app.
 */
function navUrl(event: VacationEvent) {
  const raw = (event.mapQuery ?? event.location?.en)?.trim()
  if (!raw) return null

  const coords = raw.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)

  if (coords) {
    // Never percent-encode this comma — Waze and Android's geo: parser both reject `%2C`.
    const ll = `${coords[1]},${coords[2]}`
    if (platform.value === 'android') return `geo:${ll}`
    if (platform.value === 'ios') return `maps:?daddr=${ll}&dirflg=d`
    return `https://www.google.com/maps/dir/?api=1&destination=${ll}`
  }

  // Free text: `geo:0,0?q=…` is the documented Android form but Waze ignores the `q` and
  // tries to drive to 0,0, so anything without coordinates goes to Google Maps instead.
  const q = encodeURIComponent(raw)
  if (platform.value === 'ios') return `maps:?daddr=${q}&dirflg=d`
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`
}

/** `null` until mounted, so the server and the client render the same markup. */
const now = ref<Date | null>(null)
let timer: ReturnType<typeof setInterval> | undefined

const sorted = computed(() =>
  [...events.value].sort((a, b) => eventTime(a.time) - eventTime(b.time)),
)

/** Days, in order, each with its own events. */
const days = computed(() => {
  const groups = new Map<string, typeof sorted.value>()
  for (const event of sorted.value) {
    const day = event.time.slice(0, 10)
    const group = groups.get(day)
    if (group) group.push(event)
    else groups.set(day, [event])
  }
  return [...groups].map(([day, items]) => ({ day, items }))
})

/**
 * The event happening right now — the last one that has started. Before the trip
 * begins nothing has started yet, so we point at the first event instead.
 */
const currentId = computed(() => {
  if (!now.value) return null
  const started = sorted.value.filter((event) => eventTime(event.time) <= now.value!.getTime())
  return started.at(-1)?.id ?? sorted.value[0]?.id ?? null
})

function statusOf(id: string) {
  if (!currentId.value) return 'upcoming'
  const index = sorted.value.findIndex((event) => event.id === id)
  const currentIndex = sorted.value.findIndex((event) => event.id === currentId.value)
  if (index < currentIndex) return 'past'
  if (index > currentIndex) return 'upcoming'
  return 'current'
}

/**
 * Open by default: the current event and the one after it. Before the trip starts
 * `currentId` is still null on the server, so we fall back to the first two —
 * which is also the right answer once the app hydrates.
 */
const defaultOpenIds = computed(() => {
  const index = currentId.value
    ? sorted.value.findIndex((event) => event.id === currentId.value)
    : 0
  return new Set([sorted.value[index]?.id, sorted.value[index + 1]?.id])
})

/** Cards the user has opened or closed by hand — these win over the default. */
const overrides = ref<Record<string, boolean>>({})

const isOpen = (id: string) => overrides.value[id] ?? defaultOpenIds.value.has(id)
const setOpen = (id: string, open: boolean) => (overrides.value[id] = open)

function focusCurrent(smooth = true) {
  if (!currentId.value) return
  document.getElementById(`event-${currentId.value}`)?.scrollIntoView({
    behavior: smooth ? 'smooth' : 'instant',
    block: 'center',
  })
}

/** The "jump to now" button only earns its screen space when now is off-screen. */
const showJump = ref(false)

function updateJump() {
  const el = currentId.value ? document.getElementById(`event-${currentId.value}`) : null
  if (!el) return (showJump.value = false)
  const { top, bottom } = el.getBoundingClientRect()
  showJump.value = bottom < 96 || top > window.innerHeight - 96
}

let pollTimer: ReturnType<typeof setInterval> | undefined

/** Poll only while the tab is on screen — no point burning roaming data in a pocket. */
function onVisibilityChange() {
  if (document.visibilityState === 'visible') refresh()
}

onMounted(async () => {
  const ua = navigator.userAgent
  platform.value = /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'web'

  now.value = new Date()
  timer = setInterval(() => (now.value = new Date()), 30_000)

  await restore()
  await nextTick()
  focusCurrent(false)

  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') refresh()
  }, POLL_INTERVAL)

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('scroll', updateJump, { passive: true })
  window.addEventListener('resize', updateJump, { passive: true })
})

onBeforeUnmount(() => {
  clearInterval(timer)
  clearInterval(pollTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('scroll', updateJump)
  window.removeEventListener('resize', updateJump)
})

// Scroll to whatever is current once the plan arrives (or changes underneath us).
watch(sorted, async () => {
  await nextTick()
  updateJump()
})

watch(updated, (isUpdated) => {
  if (!isUpdated) return
  toast.add({ title: t('updated'), icon: 'i-lucide-refresh-cw', color: 'primary' })
  updated.value = false
})

// The card that counts moves as the day goes on; re-check once it has re-rendered.
watch(currentId, () => nextTick(updateJump))

// 24-hour everywhere: "14:20" is half the width of "02:20 PM" and never ambiguous.
// Pinned to the trip's timezone so every phone shows Hungarian clock time.
const timeFormat = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TRIP_TIMEZONE,
    }),
)
const dayFormat = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      timeZone: TRIP_TIMEZONE,
    }),
)
const relativeFormat = computed(
  () => new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto', style: 'narrow' }),
)

/**
 * "in 2 hr" / "20 min ago". Only within a day — further out it's both useless
 * ("in 13 days", on every single row) and too wide for the gutter.
 */
function relativeTime(time: string) {
  if (!now.value) return null
  const minutes = Math.round((eventTime(time) - now.value.getTime()) / 60_000)
  if (Math.abs(minutes) >= 60 * 24) return null
  if (Math.abs(minutes) < 60) return relativeFormat.value.format(minutes, 'minute')
  return relativeFormat.value.format(Math.round(minutes / 60), 'hour')
}

/** Today's date *in Hungary* — so the badge is right even on a phone set elsewhere. */
const todayKey = computed(() => (now.value ? tripDateKey(now.value) : null))
</script>

<template>
  <Transition
    mode="out-in"
    enter-active-class="transition-opacity duration-300 ease-out"
    leave-active-class="transition-opacity duration-150 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <TripSkeleton v-if="status === 'checking'" key="checking" />
    <PassphraseGate v-else-if="status === 'locked'" key="locked" />

    <div v-else key="unlocked" class="mx-auto min-h-dvh max-w-md pb-28">
      <header
        class="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-default bg-default/85 px-4 py-3 backdrop-blur"
      >
        <h1 class="flex items-center gap-2 font-display text-xl font-semibold text-highlighted">
          <!-- The one piece of red that isn't "now": the mark itself -->
          <FolkTulip class="size-4 shrink-0 text-primary" />
          {{ t('title') }}
        </h1>

        <div class="flex items-center gap-2">
          <TripPhotos />

          <div class="flex gap-0.5 rounded-full bg-elevated p-0.5">
            <UButton
              v-for="l in locales"
              :key="l.code"
              size="xs"
              color="neutral"
              class="rounded-full"
              :variant="l.code === locale ? 'solid' : 'ghost'"
              :aria-current="l.code === locale ? 'true' : undefined"
              @click="setLocale(l.code)"
            >
              {{ l.code.toUpperCase() }}
            </UButton>
          </div>
        </div>
      </header>

      <section v-for="{ day, items } in days" :key="day">
        <h2
          class="sticky top-13 z-20 flex items-center gap-2 bg-default/90 px-4 pb-1 pt-3 font-display text-base font-semibold text-highlighted backdrop-blur"
        >
          {{ dayFormat.format(new Date(`${day}T12:00:00Z`)) }}
          <UBadge
            v-if="day === todayKey"
            size="sm"
            color="neutral"
            variant="subtle"
            class="rounded-full"
          >
            {{ t('today') }}
          </UBadge>
        </h2>

        <!-- Folk divider: a hairline broken by the tulip -->
        <div class="flex items-center gap-2 px-4 pb-3 text-dimmed/60" aria-hidden="true">
          <span class="h-px flex-1 bg-current" />
          <FolkTulip class="size-3" />
          <span class="h-px flex-1 bg-current" />
        </div>

        <ul class="px-4">
          <li
            v-for="event in items"
            :id="`event-${event.id}`"
            :key="event.id"
            class="flex scroll-mt-28 gap-3"
          >
            <!-- Time gutter: the column people actually scan -->
            <div class="w-14 shrink-0 pt-2.5 text-right">
              <time
                :datetime="event.time"
                class="block whitespace-nowrap text-sm font-semibold tabular-nums"
                :class="statusOf(event.id) === 'past' ? 'text-dimmed' : 'text-highlighted'"
              >
                {{ timeFormat.format(eventTime(event.time)) }}
              </time>
              <span
                v-if="statusOf(event.id) !== 'past' && relativeTime(event.time)"
                class="mt-0.5 block text-xs leading-tight text-dimmed"
              >
                {{ relativeTime(event.time) }}
              </span>
            </div>

            <!-- Rail: quiet neutral structure, turning red only at the current event -->
            <div class="relative flex w-3 shrink-0 justify-center">
              <span
                class="w-px transition-colors"
                :class="statusOf(event.id) === 'current' ? 'bg-primary/50' : 'bg-accented'"
              />

              <!--
                The tulip marks now; everything else is a quiet dot. It sits on a filled
                disc so the rail doesn't show through the gaps between its petals.
              -->
              <span
                v-if="statusOf(event.id) === 'current'"
                class="absolute top-1.5 flex size-6 items-center justify-center rounded-full bg-default ring-4 ring-bg"
              >
                <FolkTulip class="size-5 text-primary" />
              </span>
              <span
                v-else
                class="absolute top-3.5 size-1.5 rounded-full bg-accented ring-4 ring-bg"
              />
            </div>

            <UCollapsible
              :open="isOpen(event.id)"
              class="mb-3 min-w-0 flex-1 rounded-xl border bg-elevated/40 transition-colors"
              :class="
                statusOf(event.id) === 'current'
                  ? 'border-primary/60 bg-primary/5 shadow-sm'
                  : 'border-default'
              "
              @update:open="setOpen(event.id, $event)"
            >
              <button
                type="button"
                class="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left"
              >
                <span class="min-w-0 flex-1">
                  <UBadge
                    v-if="statusOf(event.id) === 'current'"
                    size="sm"
                    variant="subtle"
                    class="mb-1 rounded-full"
                  >
                    {{ t('now') }}
                  </UBadge>
                  <span
                    class="block font-semibold leading-snug"
                    :class="statusOf(event.id) === 'past' ? 'text-muted' : 'text-highlighted'"
                  >
                    {{ text(event.title) }}
                  </span>
                  <span
                    v-if="event.location && !isOpen(event.id)"
                    class="mt-0.5 block truncate text-xs text-dimmed"
                  >
                    {{ text(event.location) }}
                  </span>
                </span>

                <UIcon
                  name="i-lucide-chevron-down"
                  class="mt-0.5 size-4 shrink-0 text-dimmed transition-transform duration-200"
                  :class="isOpen(event.id) && 'rotate-180'"
                />
              </button>

              <template #content>
                <div class="space-y-3 px-3 pb-3">
                  <p class="text-sm leading-relaxed text-toned">{{ text(event.description) }}</p>

                  <div
                    v-if="event.location || navUrl(event)"
                    class="flex items-center gap-2 border-t border-default pt-2.5"
                  >
                    <p
                      v-if="event.location"
                      class="flex min-w-0 flex-1 items-start gap-1.5 text-sm text-muted"
                    >
                      <UIcon name="i-lucide-map-pin" class="mt-0.5 size-3.5 shrink-0" />
                      {{ text(event.location) }}
                    </p>

                    <UButton
                      v-if="navUrl(event)"
                      :to="navUrl(event)!"
                      :target="platform === 'web' ? '_blank' : undefined"
                      icon="i-lucide-navigation"
                      :label="t('navigate')"
                      size="sm"
                      variant="soft"
                      class="shrink-0 rounded-full"
                    />
                  </div>
                </div>
              </template>
            </UCollapsible>
          </li>
        </ul>
      </section>

      <Transition
        enter-active-class="!transition-all !duration-200"
        leave-active-class="!transition-all !duration-150"
        enter-from-class="translate-y-2 opacity-0"
        leave-to-class="translate-y-2 opacity-0"
      >
        <UButton
          v-if="showJump"
          icon="i-lucide-crosshair"
          :label="t('focusCurrent')"
          size="sm"
          class="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 rounded-full shadow-lg"
          @click="focusCurrent()"
        />
      </Transition>
    </div>
  </Transition>
</template>
