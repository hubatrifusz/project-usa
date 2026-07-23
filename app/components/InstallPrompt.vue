<script setup lang="ts">
/**
 * Chrome no longer pops its own "Add to Home Screen" banner — it fires
 * `beforeinstallprompt` and expects the page to ask. Without this component the app is
 * perfectly installable but nothing ever offers it, which is exactly what happened.
 *
 * `$pwa` is client-only, so everything here is guarded.
 */
const { t } = useI18n()
const { $pwa } = useNuxtApp()

const busy = ref(false)

async function install() {
  busy.value = true
  await $pwa?.install()
  busy.value = false
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300"
    leave-active-class="transition duration-200"
    enter-from-class="translate-y-4 opacity-0"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled"
      class="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-xl border border-default bg-elevated p-3 shadow-lg backdrop-blur"
      role="dialog"
      :aria-label="t('install.title')"
    >
      <div class="flex items-center gap-3">
        <FolkTulip class="size-8 shrink-0 text-primary" />

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-highlighted">{{ t('install.title') }}</p>
          <p class="mt-0.5 text-xs leading-snug text-muted">{{ t('install.hint') }}</p>
        </div>
      </div>

      <div class="mt-3 flex gap-2">
        <UButton
          size="sm"
          block
          class="flex-1"
          :loading="busy"
          :label="t('install.action')"
          @click="install()"
        />
        <UButton
          size="sm"
          variant="ghost"
          color="neutral"
          :label="t('install.dismiss')"
          @click="$pwa?.cancelInstall()"
        />
      </div>
    </div>
  </Transition>
</template>
