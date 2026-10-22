<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSession } from '@/api/http'

const user = ref(null)
const route = useRoute()

async function chargerSession() {
  user.value = await getSession()
}
onMounted(chargerSession)
watch(() => route.fullPath, chargerSession)

const aRole = (r) => user.value?.roles?.includes(r)
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container-fluid">
      <RouterLink class="navbar-brand" to="/">Gestion RH</RouterLink>
      <ul class="navbar-nav me-auto">
        <!-- P5 : offres ouvertes, pour tout le monde (candidats sans compte compris) -->
        <li class="nav-item">
          <RouterLink class="nav-link" to="/emplois">Postuler</RouterLink>
        </li>
        <!-- P4 : offres d'emploi (RH) -->
        <li class="nav-item" v-if="aRole('RH') || aRole('DG')">
          <RouterLink class="nav-link" to="/offres">Offres d'emploi</RouterLink>
        </li>
        <li class="nav-item" v-if="!aRole('')">
          <RouterLink class="nav-link" to="/besoins">Besoins</RouterLink>
        </li>
        <!-- P5 : candidatures reçues (RH) -->
        <li class="nav-item" v-if="aRole('RH') || aRole('DG')">
          <RouterLink class="nav-link" to="/candidatures">Candidatures</RouterLink>
        </li>

        <!-- P2 : expression de besoin (Manager) et demande de poste -->
        <li class="nav-item" v-if="aRole('Manager') || aRole('RH')">
          <RouterLink class="nav-link" to="/besoins/nouveau">Nouveau besoin</RouterLink>
        </li>
        <li class="nav-item" v-if="aRole('Manager') || aRole('RH')">
          <RouterLink class="nav-link" to="/postes/demande">Demander un poste</RouterLink>
        </li>

        <!-- Lien vers mes évaluations -->
        <li class="nav-item" v-if="user">
          <RouterLink class="nav-link" to="/mes-evaluations">Mes évaluations</RouterLink>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-3">
        <template v-if="user">
          <span class="text-light">
            Connecté : <strong>{{ user.login }}</strong>
            <span class="text-warning small">({{ user.roles?.join(', ') }})</span>
          </span>
          <!-- Login / logout gérés par le back (P1) -->
          <form action="/auth/logout" method="post" class="m-0">
            <button class="btn btn-outline-light btn-sm" type="submit">Déconnexion</button>
          </form>
        </template>
        <a v-else class="btn btn-outline-light btn-sm" href="/auth/login">Connexion</a>
      </div>
    </div>
  </nav>

  <RouterView />
</template>
