<script setup lang="ts">
const { t } = useI18n()
const { error, unlock } = useTrip()

const passphrase = ref('')
const busy = ref(false)
const reveal = ref(false)
const input = useTemplateRef('input')

const blocked = computed(() => error.value === 'insecureContext')

async function submit() {
  if (!passphrase.value || busy.value || blocked.value) return
  busy.value = true
  // Key derivation is deliberately slow; yield so the button can show its loading state.
  await nextTick()
  const ok = await unlock(passphrase.value)
  if (ok) passphrase.value = ''
  busy.value = false
}

// Pop the keyboard the instant the gate appears — one less tap before typing.
onMounted(() => {
  if (!blocked.value) input.value?.$el?.querySelector('input')?.focus()
})
</script>

<template>
  <div class="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
    <!-- The theme makes its first impression here, then stays out of the timeline's way -->
    <FolkTulip
      class="pointer-events-none absolute -top-24 left-1/2 size-120 -translate-x-1/2 text-primary/5"
    />

    <div class="relative w-full max-w-xs">
      <div class="text-center">
        <div
          class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <FolkTulip class="size-7" />
        </div>

        <h1 class="mt-5 font-display text-2xl font-semibold text-highlighted">
          {{ t('gate.title') }}
        </h1>
        <p class="mt-1.5 text-sm leading-relaxed text-muted">{{ t('gate.hint') }}</p>
      </div>

      <form class="mt-7 space-y-3" @submit.prevent="submit">
        <UInput
          ref="input"
          v-model="passphrase"
          :type="reveal ? 'text' : 'password'"
          autocomplete="current-password"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="go"
          size="xl"
          class="w-full"
          :disabled="blocked"
          :placeholder="t('gate.passphrase')"
          :aria-label="t('gate.passphrase')"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              v-if="passphrase"
              :icon="reveal ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              size="sm"
              variant="link"
              color="neutral"
              tabindex="-1"
              :aria-label="t(reveal ? 'gate.hidePassphrase' : 'gate.showPassphrase')"
              @click="reveal = !reveal"
            />
          </template>
        </UInput>

        <UButton
          type="submit"
          size="xl"
          block
          trailing-icon="i-lucide-arrow-right"
          :loading="busy"
          :disabled="!passphrase || blocked"
          :label="t('gate.unlock')"
        />
      </form>

      <p
        v-if="error"
        class="mt-3 flex items-start gap-1.5 text-sm leading-relaxed text-error"
        role="alert"
      >
        <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" />
        {{ t(`gate.${error}`) }}
      </p>
    </div>
  </div>
</template>
