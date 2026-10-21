<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page">
    <h1>404</h1>
    <p>Cette page n'existe pas.</p>
    <RouterLink to="/">Retour à l'accueil</RouterLink>
  </div>
</template>

<style scoped>
.page {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
}

h1 {
  margin: 0;
  font-size: 48px;
}

p {
  margin: 0 0 8px;
  color: #6b7280;
}

a {
  color: #2563eb;
}
</style>
