export default defineAppConfig({
  ui: {
    colors: {
      // Palettes are defined in app/assets/css/main.css.
      primary: 'madder',
      neutral: 'linen',
      // One accent means one accent: point the other roles at the same palette so no
      // stray Tailwind blue or red can leak in. `error` matters most — it's the gate's
      // message, and default red sitting beside madder is a visible clash.
      secondary: 'madder',
      error: 'madder',
      info: 'madder',
    },
  },
})
