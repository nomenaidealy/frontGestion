<script setup>
import Vide from '@/components/ui/Vide.vue'
</script>

<template>
  <Vide titre="Cette page n'existe pas" texte="Le lien est peut-être ancien. Repartez de l'accueil.">
    <RouterLink to="/" class="btn btn-primary">Revenir à l'accueil</RouterLink>
  </Vide>
</template>
