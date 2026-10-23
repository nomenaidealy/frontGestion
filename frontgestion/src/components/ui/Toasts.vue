<script setup>
import { useToast } from '@/composables/useToast'
const { messages, fermer } = useToast()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <div v-for="m in messages" :key="m.id" class="toast" :class="m.ton">
      <span>{{ m.texte }}</span>
      <button type="button" aria-label="Fermer" @click="fermer(m.id)">×</button>
    </div>
  </div>
</template>
