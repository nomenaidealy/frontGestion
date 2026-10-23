<script setup>
// Espace public (candidats) : offres, candidature, réponse à une proposition.
</script>

<template>
  <div class="public">
    <header class="public-bar">
      <RouterLink to="/emplois" class="side-brand">
        <span class="side-brand-mark">RH</span>
        <span><b>Carrières</b><small>Rejoignez nos équipes</small></span>
      </RouterLink>
      <nav>
        <RouterLink to="/emplois">Offres d'emploi</RouterLink>
        <RouterLink to="/login">Espace collaborateur</RouterLink>
      </nav>
    </header>
    <main class="public-main"><RouterView /></main>
    <footer class="public-foot">Vos données ne servent qu'au traitement de votre candidature.</footer>
  </div>
</template>
