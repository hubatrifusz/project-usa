<script setup lang="ts">
// Keeps <html lang> in sync with the selected locale.
const head = useLocaleHead()
useHead(head)
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>
