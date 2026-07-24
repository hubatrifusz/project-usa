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
 */
export const events: VacationEvent[] = [
  // ── Friday 24 July — arrival ────────────────────────────────────────────────
  {
    id: 'arrival',
    time: '2026-07-24T17:35',
    title: {
      en: 'Arrival & Pickup in Vienna',
      hu: 'Érkezés és felvétel Bécsben',
    },
    location: {
      en: 'Vienna International Airport, Terminal 1',
      hu: 'Bécs-Schwechati nemzetközi repülőtér, 1-es terminál',
    },
    mapQuery: '48.12098687715911,16.563444463544165',
    description: {
      en: 'Flight arrival, luggage pick-up, and drive to Bábolna.',
      hu: 'Megérkezés, csomagfelvétel és indulás Bábolnára.',
    },
  },
  {
    id: 'first-dinner',
    time: '2026-07-24T20:00',
    title: {
      en: 'First dinner',
      hu: 'Első vacsora',
    },
    location: {
      en: 'Bábolna, Radnóti Miklós Street 32',
      hu: 'Bábolna, Radnóti Miklós utca 32',
    },
    description: {
      en: 'Welcome dinner in Bábolna.',
      hu: 'Üdvözlő vacsora Bábolnán.',
    },
  },

  // ── Saturday 25 July ───────────────────────────────────────────────────
  {
    id: 'cemetery',
    time: '2026-07-25T11:00',
    title: {
      en: 'Cemetery visit in Tárkány',
      hu: 'Tárkányi temető meglátogatása',
    },
    location: {
      en: 'Tárkány cemetery',
      hu: 'Tárkányi temető',
    },
    mapQuery: '47.59634361674503,18.008711376913684',
    description: {
      en: 'Visiting the cemetery in Tárkány.',
      hu: 'Megemlékezés a tárkányi temetőben.',
    },
  },
  {
    id: 'tractor-driving',
    time: '2026-07-25T12:30',
    title: {
      en: 'Tractor driving at Agrotec',
      hu: 'Traktorozás az Agrotecnél',
    },
    location: {
      en: 'Komárom, Puskás Tivadar Street 4/a',
      hu: 'Komárom, Puskás Tivadar utca 4/a',
    },
    mapQuery: '47.74420247284381,18.080009427475822',
    description: {
      en: 'Tractor driving experience at Agrotec.',
      hu: 'Traktorvezetés az Agrotecnél.',
    },
  },
  {
    id: 'quick-dinner',
    time: '2026-07-25T14:00',
    title: {
      en: 'Quick bite to eat',
      hu: 'Gyors falatok',
    },
    description: {
      en: 'Quick lunch before the afternoon cookout.',
      hu: 'Gyors ebéd a délutáni sütögetés előtt.',
    },
  },
  {
    id: 'cookout',
    time: '2026-07-25T16:00',
    title: {
      en: "Cookout at Zoli's",
      hu: 'Sütögetés Zoliéknál',
    },
    description: {
      en: 'Barbecue and evening hangout at Zoli’s.',
      hu: 'Kerti sütögetés és összejövetel Zoliéknál.',
    },
  },

  // ── Sunday 26 July ─────────────────────────────────────────────────
  {
    id: 'pannonhalma',
    time: '2026-07-26T10:30',
    title: {
      en: 'Pannonhalma Archabbey',
      hu: 'Kirándulás Pannonhalmára',
    },
    location: {
      en: 'Pannonhalma, Vár 1',
      hu: 'Pannonhalma, Vár 1',
    },
    mapQuery: '47.55297677961083,17.76036712145006',
    description: {
      en: 'Touring Pannonhalma Archabbey and grounds.',
      hu: 'A Pannonhalmi Főapátság megtekintése.',
    },
  },
  {
    id: 'abel-eszti',
    time: '2026-07-26T12:00',
    title: {
      en: 'Visit Ábel and Eszti',
      hu: 'Ábel és Eszti meglátogatása',
    },
    location: {
      en: 'Győr, Kagyló Street 12',
      hu: 'Győr, Kagyló u. 12',
    },
    mapQuery: '47.70150146544114,17.642393145647244',
    description: {
      en: 'Checking out their new place.',
      hu: 'Checking out their new place.',
    },
  },
  {
    id: 'puspokvar',
    time: '2026-07-26T13:00',
    title: {
      en: 'Püspökvár Lookout Tower',
      hu: 'Püspökvár látogatás',
    },
    location: {
      en: 'Győr, Káptalandomb 1',
      hu: 'Győr, Káptalandomb 1',
    },
    mapQuery: '47.68905103916751,17.630215350964875',
    description: {
      en: 'Visiting the Bishop’s Castle and lookout tower.',
      hu: 'A Püspökvár és kilátótorony meglátogatása.',
    },
  },
  {
    id: 'strudel',
    time: '2026-07-26T14:30',
    title: {
      en: 'Strudel tasting',
      hu: 'Rétesezés',
    },
    description: {
      en: 'Fresh Hungarian strudel tasting.',
      hu: 'Friss, hagyományos rétesek kóstolása.',
    },
  },
  {
    id: 'boating',
    time: '2026-07-26T17:30',
    title: {
      en: 'Boating in Győr',
      hu: 'Hajókázás Győrben',
    },
    location: {
      en: 'Győr, Töltésszer 18',
      hu: 'Győr, Töltésszer 18',
    },
    mapQuery: '47.69158105648993,17.623983897160787',
    description: {
      en: 'Scenic boat ride along the rivers of Győr.',
      hu: 'Sétahajózás Győr folyóin.',
    },
  },
  {
    id: 'second-dinner',
    time: '2026-07-26T19:30',
    title: {
      en: 'Dinner at Apátúr Restaurant',
      hu: 'Vacsora az Apátúr étteremben',
    },
    location: {
      en: 'Győr, Széchenyi Square 7',
      hu: 'Győr, Széchenyi tér 7',
    },
    mapQuery: '47.68833796677193,17.634816098082922',
    description: {
      en: 'Dinner at Apátúr Restaurant in downtown Győr.',
      hu: 'Vacsora az Apátúr étteremben Győr belvárosában.',
    },
  },

  // ── Monday 27 July ─────────────────────────────────────────────
  {
    id: 'automobile-museum',
    time: '2026-07-27T11:00',
    title: {
      en: 'Automobile museum in Dörgicse',
      hu: 'Autómúzeum Dörgicsén',
    },
    location: {
      en: 'Dörgicse, Csörgőfa Street 33/2',
      hu: 'Dörgicse, Csörgőfa u. 33/2',
    },
    mapQuery: '46.91936131734491,17.72269773720829',
    description: {
      en: 'Classic car collection at Kaáli Automobile Museum.',
      hu: 'Veterán autógyűjtemény a Kaáli Autómúzeumban.',
    },
  },
  {
    id: 'balatonfuzfo',
    time: '2026-07-27T15:00',
    title: {
      en: 'Bobsledding in Balatonfűzfő',
      hu: 'Bobozás Balatonfűzfőn',
    },
    location: {
      en: 'Balatonfűzfő, Uszoda Street 2',
      hu: 'Balatonfűzfő, Uszoda u. 2',
    },
    mapQuery: '47.07063936676224,18.026400481286494',
    description: {
      en: 'Bobsledding at Balatonfűzfő Leisure Park.',
      hu: 'Bobozás a fűzfői szabadidőparkban.',
    },
  },
  {
    id: 'balaton',
    time: '2026-07-27T18:00',
    title: {
      en: 'Relaxing by Lake Balaton',
      hu: 'Láblógatás a Balatonnál',
    },
    description: {
      en: 'Relaxing and swimming by Lake Balaton.',
      hu: 'Csobbanás és pihenés a Balaton-parton.',
    },
  },
  {
    id: 'gant-dinner',
    time: '2026-07-27T19:30',
    title: {
      en: 'Dinner at Vértes Restaurant',
      hu: 'Vacsora a Vértes Vendéglőben',
    },
    location: {
      en: 'Gánt, Hegyalja Road 59',
      hu: 'Gánt, Hegyalja út 59',
    },
    mapQuery: '47.390023882795944,18.387840650980763',
    description: {
      en: 'Dinner at Vértes Restaurant in Gánt.',
      hu: 'Vacsora a gánti Vértes Vendéglőben.',
    },
  },

  // ── Tuesday 28 July ─────────────────────────────────────────────────
  {
    id: 'fort-monostor',
    time: '2026-07-28T12:00',
    title: {
      en: 'Visit Fort Monostor',
      hu: 'Monostori erőd meglátogatása',
    },
    location: {
      en: 'Komárom, Danube bank',
      hu: 'Komárom, Duna-part',
    },
    mapQuery: '47.75070871364798,18.097160361690793',
    description: {
      en: 'Exploring the 19th-century Danube fortress.',
      hu: 'A 19. századi Duna-parti erődítmény felfedezése.',
    },
  },
  {
    id: 'last-dinner',
    time: '2026-07-28T18:00',
    title: {
      en: "Dinner at Grandma's",
      hu: 'Vacsora Tercsi mamáéknál',
    },
    location: {
      en: 'Bábolna, Kossuth Lajos Street 8',
      hu: 'Bábolna, Kossuth Lajos u. 8',
    },
    description: {
      en: 'Dinner on our final evening.',
      hu: 'Vacsora az utolsó estén.',
    },
  },
]
