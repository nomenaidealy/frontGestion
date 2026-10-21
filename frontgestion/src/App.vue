<template>
  <nav class="menu">

    <RouterLink to="/besoins/nouveau">Nouveau besoin</RouterLink>
    <RouterLink to="/postes/demande">Demander un poste</RouterLink>
  </nav>
  <main class="contenu">
    <RouterView />
  </main>
</template>

<style>
.menu { display: flex; gap: 16px; padding: 12px 24px; background: #1f2937; }
.menu a { color: #fff; text-decoration: none; }
.menu a.router-link-active { font-weight: bold; text-decoration: underline; }
.contenu { max-width: 720px; margin: 24px auto; padding: 0 16px; font-family: sans-serif; }
</style>