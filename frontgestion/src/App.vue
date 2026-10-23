<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import PublicLayout from '@/layouts/PublicLayout.vue'
import Toasts from '@/components/ui/Toasts.vue'

// meta.layout : 'auth' (connexion, inscription), 'public' (candidats), sinon l'application.
const route = useRoute()
const layout = computed(() => route.meta.layout || 'app')
</script>

<template>
  <RouterView v-if="layout === 'auth'" />
  <PublicLayout v-else-if="layout === 'public'" />
  <AppShell v-else-if="route.matched.length" />
  <Toasts />
</template>
