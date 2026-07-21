export type LocaleCode = 'en' | 'hu'

/** A piece of text in every language the app supports. */
export type Localized = Record<LocaleCode, string>

export interface VacationEvent {
  /** Stable id, used for anchoring/scrolling. Must be unique. */
  id: string
  /**
   * Date & time as `YYYY-MM-DDTHH:mm`, always **Hungarian local time** — write what a
   * clock on the wall in Budapest would say. It's read in the trip's timezone
   * (`app/utils/trip-time.ts`), so phones still set to another zone stay correct.
   */
  time: string
  title: Localized
  /** Optional. Leave it out for events that aren't tied to a place. */
  location?: Localized
  /**
   * Destination for the navigation button. Use `'lat,lng'` — coordinates are the only
   * form every maps app handles, and the only form that opens the phone's default nav
   * app. Without it we fall back to the English `location` as a text search, which always
   * lands in Google Maps and fails outright for vague names. Grab coordinates by
   * right-clicking a spot in Google Maps.
   */
  mapQuery?: string
  description: Localized
}

/**
 * The plan. Order doesn't matter — events are sorted by `time` automatically.
 *
 * Placeholder data: a five-day Hungary trip, 19–23 July 2026, so the middle day is
 * "today". Coordinates are approximate — replace them with real ones from Google Maps.
 */
export const events: VacationEvent[] = [
  // ── Sunday 19 July — arrival ────────────────────────────────────────────────
  {
    id: 'arrival',
    time: '2026-07-19T13:40',
    title: {
      en: 'Landing in Budapest',
      hu: 'Landolás Budapesten',
    },
    location: {
      en: 'Liszt Ferenc Airport, Terminal 2A',
      hu: 'Liszt Ferenc repülőtér, 2A terminál',
    },
    mapQuery: '47.4370,19.2611',
    description: {
      en: 'Pick up the rental car at the desk in arrivals, then straight to the flat.',
      hu: 'Autóbérlés az érkezési oldalon, aztán irány egyenesen a lakás.',
    },
  },
  {
    id: 'apartment',
    time: '2026-07-19T15:30',
    title: {
      en: 'Check in at the apartment',
      hu: 'Beköltözés a lakásba',
    },
    location: {
      en: 'District VII, Dob utca',
      hu: 'VII. kerület, Dob utca',
    },
    mapQuery: '47.4979,19.0632',
    description: {
      en: 'Key box code is 4471. Parking is in the courtyard — the gate remote is on the shelf.',
      hu: 'A kulcsszéf kódja 4471. A parkoló az udvarban van, a kapunyitó a polcon.',
    },
  },
  {
    id: 'first-dinner',
    time: '2026-07-19T19:00',
    title: {
      en: 'First dinner',
      hu: 'Első vacsora',
    },
    // No `location` yet — so no pin and no navigation button on this card.
    description: {
      en: "Somewhere on Kazinczy utca. We'll decide when we see who's still awake.",
      hu: 'Valahol a Kazinczy utcában. Majd eldöntjük, ki bírja még ébren.',
    },
  },

  // ── Monday 20 July — Buda ───────────────────────────────────────────────────
  {
    id: 'castle-hill',
    time: '2026-07-20T09:30',
    title: {
      en: "Castle Hill & Fisherman's Bastion",
      hu: 'Budai Vár és Halászbástya',
    },
    location: {
      en: "Fisherman's Bastion, Buda Castle district",
      hu: 'Halászbástya, Budai Várnegyed',
    },
    mapQuery: '47.5025,19.0347',
    description: {
      en: 'Funicular up from Clark Ádám tér. Go early — by eleven the terraces are packed.',
      hu: 'Siklóval fel a Clark Ádám térről. Menjünk korán, tizenegyre megtelnek a teraszok.',
    },
  },
  {
    id: 'market-hall',
    time: '2026-07-20T13:00',
    title: {
      en: 'Lunch at the Great Market Hall',
      hu: 'Ebéd a Nagy Vásárcsarnokban',
    },
    location: {
      en: 'Great Market Hall, Fővám tér',
      hu: 'Nagy Vásárcsarnok, Fővám tér',
    },
    mapQuery: '47.4869,19.0587',
    description: {
      en: 'Lángos upstairs, paprika and honey downstairs for the people back home.',
      hu: 'Lángos az emeleten, paprika és méz a földszinten az otthoniaknak.',
    },
  },
  {
    id: 'szechenyi-bath',
    time: '2026-07-20T16:00',
    title: {
      en: 'Széchenyi Baths',
      hu: 'Széchenyi fürdő',
    },
    location: {
      en: 'Széchenyi Thermal Bath, City Park',
      hu: 'Széchenyi gyógyfürdő, Városliget',
    },
    mapQuery: '47.5187,19.0827',
    description: {
      en: 'Bring flip-flops and a towel each. Lockers take a card.',
      hu: 'Mindenki hozzon papucsot és törölközőt. A szekrény kártyával megy.',
    },
  },

  // ── Tuesday 21 July — today ─────────────────────────────────────────────────
  {
    id: 'szentendre',
    time: '2026-07-21T09:00',
    title: {
      en: 'Drive up to Szentendre',
      hu: 'Kirándulás Szentendrére',
    },
    location: {
      en: 'Szentendre, main square',
      hu: 'Szentendre, Fő tér',
    },
    mapQuery: '47.6694,19.0759',
    description: {
      en: 'About 40 minutes along the Danube. Park by the river, the old town is pedestrian.',
      hu: 'Kb. 40 perc a Duna mentén. A folyónál parkoljunk, az óváros sétálóutca.',
    },
  },
  {
    id: 'marzipan-museum',
    time: '2026-07-21T11:30',
    title: {
      en: 'Marzipan Museum',
      hu: 'Marcipán Múzeum',
    },
    location: {
      en: 'Dumtsa Jenő utca, Szentendre',
      hu: 'Dumtsa Jenő utca, Szentendre',
    },
    mapQuery: '47.6684,19.0742',
    description: {
      en: 'Small and silly, twenty minutes tops — but the kids will not forgive us if we skip it.',
      hu: 'Kicsi és bugyuta, húsz perc az egész — de a gyerekek nem bocsátanák meg, ha kihagynánk.',
    },
  },
  {
    id: 'parliament',
    time: '2026-07-21T16:00',
    title: {
      en: 'Parliament tour',
      hu: 'Parlament látogatás',
    },
    location: {
      en: 'Hungarian Parliament, Kossuth Lajos tér',
      hu: 'Országház, Kossuth Lajos tér',
    },
    mapQuery: '47.5072,19.0455',
    description: {
      en: 'Booked for 16:00 sharp, gate X. Photo ID for everyone, late arrivals are turned away.',
      hu: 'Pontban 16:00-ra foglaltuk, X. kapu. Mindenkinek kell fényképes igazolvány, a későket nem engedik be.',
    },
  },
  {
    id: 'danube-cruise',
    time: '2026-07-21T20:30',
    title: {
      en: 'Evening cruise on the Danube',
      hu: 'Esti dunai hajózás',
    },
    location: {
      en: 'Dock 11, Vigadó tér',
      hu: '11-es kikötő, Vigadó tér',
    },
    mapQuery: '47.4956,19.0490',
    description: {
      en: 'Boarding from 20:15. Take a jacket, it gets cold on the water once the lights come on.',
      hu: 'Beszállás 20:15-től. Vigyünk kabátot, a vízen hűvös lesz, mire kigyúlnak a fények.',
    },
  },

  // ── Wednesday 22 July — Balaton ─────────────────────────────────────────────
  {
    id: 'drive-balaton',
    time: '2026-07-22T08:30',
    title: {
      en: 'Drive to Lake Balaton',
      hu: 'Autóút a Balatonhoz',
    },
    location: {
      en: 'Tihany Abbey',
      hu: 'Tihanyi Bencés Apátság',
    },
    mapQuery: '46.9139,17.8892',
    description: {
      en: 'Roughly two hours on the M7. Buy the motorway sticker before we set off.',
      hu: 'Nagyjából két óra az M7-esen. Indulás előtt vegyük meg az autópálya-matricát.',
    },
  },
  {
    id: 'balaton-swim',
    time: '2026-07-22T14:00',
    title: {
      en: 'Swimming at Balatonfüred',
      hu: 'Fürdés Balatonfüreden',
    },
    location: {
      en: 'Balatonfüred, Kisfaludy beach',
      hu: 'Balatonfüred, Kisfaludy strand',
    },
    mapQuery: '46.9530,17.8900',
    description: {
      en: 'Shallow for a long way out, good for the little ones. Ice cream on the promenade after.',
      hu: 'Sokáig sekély, jó a kicsiknek. Utána fagyi a sétányon.',
    },
  },

  // ── Thursday 23 July — home ─────────────────────────────────────────────────
  {
    id: 'flight-home',
    time: '2026-07-23T11:15',
    title: {
      en: 'Flight home',
      hu: 'Hazaút',
    },
    location: {
      en: 'Liszt Ferenc Airport, Terminal 2B',
      hu: 'Liszt Ferenc repülőtér, 2B terminál',
    },
    mapQuery: '47.4370,19.2611',
    description: {
      en: 'Drop the car at the rental return by 09:30, then bags and security.',
      hu: 'Az autót 09:30-ig le kell adni a kölcsönzőnél, aztán csomagfeladás és biztonsági ellenőrzés.',
    },
  },
]
