<script setup lang="ts">
// Keeps <html lang> in sync with the selected locale.
const head = useLocaleHead()
useHead(head)
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <!-- Sits above both the gate and the timeline; only appears when installable. -->
    <ClientOnly>
      <InstallPrompt />
    </ClientOnly>
  </UApp>
</template>
