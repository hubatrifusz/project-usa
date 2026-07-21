/**
 * Every time in the itinerary is Hungarian wall-clock time.
 *
 * Without this, `Date.parse('2026-07-21T16:00')` is interpreted in *the phone's* timezone,
 * so a family member whose phone is still on home time sees "Now" on the wrong event and
 * the "Today" badge on the wrong day. Pinning the zone makes every device agree.
 */
export const TRIP_TIMEZONE = 'Europe/Budapest'

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TRIP_TIMEZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** How far the trip's timezone is from UTC at a given instant (handles summer time). */
function offsetAt(epoch: number) {
  const parts = partsFormatter.formatToParts(new Date(epoch))
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)!.value)

  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    // Some environments render midnight as hour 24.
    value('hour') % 24,
    value('minute'),
    value('second'),
  )
  return asUtc - epoch
}

/**
 * Turns a naive `YYYY-MM-DDTHH:mm` from the events file into a real instant, reading it
 * as Hungarian local time no matter where the phone thinks it is.
 */
export function eventTime(naive: string) {
  // Read the wall-clock digits as if they were UTC, then shift by the real offset.
  const withSeconds = /T\d{2}:\d{2}$/.test(naive) ? `${naive}:00` : naive
  const asIfUtc = Date.parse(`${withSeconds}Z`)
  if (Number.isNaN(asIfUtc)) return Number.NaN

  // Correct by the offset, then re-check: on a DST changeover the offset at the corrected
  // instant can differ from the offset at the first guess.
  const firstGuess = asIfUtc - offsetAt(asIfUtc)
  return asIfUtc - offsetAt(firstGuess)
}

/** `YYYY-MM-DD` for an instant, as it reads on a Hungarian calendar. */
export function tripDateKey(date: Date) {
  const parts = partsFormatter.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value
  return `${value('year')}-${value('month')}-${value('day')}`
}
