// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxtjs/i18n', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      photosAlbumUrl: 'https://photos.app.goo.gl/wvyLTLCEraaKRDBr9',
    },
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },

        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Trip' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Hungary trip',
      short_name: 'Trip',
      description: 'Our family trip plan',
      lang: 'hu',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#faf4e8',
      theme_color: '#faf4e8',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // The app shell — enough to boot with no signal at all.
      globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico,json}'],
      // ...except the itinerary. It must never be served stale: the app keeps its own
      // offline copy in localStorage, and mid-trip edits have to win.
      globIgnores: ['**/events.enc.json'],
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: /\/events\.enc\.json/,
          handler: 'NetworkOnly',
        },
      ],
      cleanupOutdatedCaches: true,
    },
    // The string is the localStorage key used to remember "not now".
    client: { installPrompt: 'trip:install-dismissed' },
    devOptions: { enabled: false },
  },
  fonts: {
    families: [
      {
        name: 'Fraunces',
        provider: 'google',
        weights: [400, 600, 700],
        // latin-ext carries the Hungarian double acutes (ő, ű).
        subsets: ['latin', 'latin-ext'],
      },
    ],
  },
  // Cache headers for the itinerary live in `public/_headers` (Netlify) and `vercel.json`
  // (Vercel). `routeRules` would be ignored here: `nuxt generate` uses the static preset,
  // which emits no header config at all.
  i18n: {
    defaultLocale: 'en',
    // One URL for every language; the choice is remembered in a cookie.
    strategy: 'no_prefix',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'hu', language: 'hu-HU', name: 'Magyar', file: 'hu.json' },
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: 'locale' },
  },
})
