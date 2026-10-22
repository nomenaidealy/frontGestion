<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineProps({ message: { type: String, default: 'Vous devez être connecté pour voir cette page.' } })

const router = useRouter()
const route = useRoute()
const lien = computed(() =>
  router.hasRoute('login') ? router.resolve({ name: 'login', query: { redirect: route.fullPath } }).href : '/auth/login')
</script>

<template>
  <div class="alert alert-warning d-flex align-items-center justify-content-between">
    <span>{{ message }}</span>
    <a :href="lien" class="btn btn-primary btn-sm">Se connecter</a>
  </div>
</template>
