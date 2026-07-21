<script setup lang="ts">
// Placeholder timeline shown while a saved session is being decrypted on reload. It mirrors
// the real layout — sticky bar, time gutter, rail, cards — so unlocking feels like the
// content sharpening into place rather than one screen swapping for another.
const { t } = useI18n()

// Varied widths read as real content rather than a test pattern.
const rows = [
  { title: 'w-32', line: 'w-40' },
  { title: 'w-44', line: 'w-28' },
  { title: 'w-28', line: 'w-36' },
  { title: 'w-40', line: 'w-24' },
  { title: 'w-36', line: 'w-40' },
]
</script>

<template>
  <div class="mx-auto min-h-dvh max-w-md pb-28" aria-hidden="true">
    <header
      class="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-default bg-default/85 px-4 py-3 backdrop-blur"
    >
      <h1 class="flex items-center gap-2 font-display text-xl font-semibold text-highlighted">
        <FolkTulip class="size-4 shrink-0 text-primary" />
        {{ t('title') }}
      </h1>
      <div class="h-7 w-24 animate-pulse rounded-full bg-elevated" />
    </header>

    <div class="px-4 pt-4">
      <div class="mb-3 h-4 w-28 animate-pulse rounded bg-elevated" />

      <ul>
        <li v-for="(row, i) in rows" :key="i" class="flex gap-3">
          <div class="w-14 shrink-0 space-y-1.5 pt-2.5">
            <div class="ml-auto h-4 w-9 animate-pulse rounded bg-elevated" />
          </div>

          <div class="relative flex w-3 shrink-0 justify-center">
            <span class="w-px bg-accented" />
            <span class="absolute top-3.5 size-1.5 rounded-full bg-accented" />
          </div>

          <div class="mb-3 flex-1 rounded-xl border border-default bg-elevated/40 px-3 py-2.5">
            <div class="h-4 animate-pulse rounded bg-elevated" :class="row.title" />
            <div class="mt-2 h-3 animate-pulse rounded bg-elevated/70" :class="row.line" />
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
