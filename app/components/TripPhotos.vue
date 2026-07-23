<script setup lang="ts">
/**
 * Opens the shared trip photo album. This is a plain link-out, not an in-app uploader:
 * Google's Photos API can't append to *our* album from the browser, but a Google Photos
 * *shared* album lets any family member add their own shots straight into the owner's
 * library. Set the album's share link via `runtimeConfig.public.photosAlbumUrl`
 * (nuxt.config) — until then there's no link, so the button stays hidden.
 */
const { t } = useI18n()
const albumUrl = useRuntimeConfig().public.photosAlbumUrl
</script>

<template>
  <UButton
    v-if="albumUrl"
    :to="albumUrl"
    target="_blank"
    rel="noopener"
    icon="i-lucide-camera"
    size="sm"
    color="neutral"
    variant="ghost"
    class="rounded-full"
    :aria-label="t('photos.open')"
    :title="t('photos.open')"
  />
</template>
