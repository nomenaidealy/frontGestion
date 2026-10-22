<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { currentUser: user, loadSession, logout } = useAuth()

// La session peut expirer côté back : on la relit à chaque changement de page
watch(() => route.fullPath, () => loadSession())

const aRole = (...roles) => roles.some((r) => user.value?.roles?.includes(r))
const estRh = computed(() => aRole('RH'))
const peutVoirBesoins = computed(() => aRole('RH', 'Manager', 'Finance', 'DG'))
const peutDemander = computed(() => aRole('Manager', 'RH', 'DG'))

async function deconnecter() {
  await logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container-fluid">
      <RouterLink class="navbar-brand" to="/">Gestion RH</RouterLink>
      <ul class="navbar-nav me-auto flex-wrap">
        <!-- P5 : offres ouvertes, pour tout le monde (candidats sans compte compris) -->
        <li class="nav-item">
          <RouterLink class="nav-link" to="/emplois">Postuler</RouterLink>
        </li>

        <!-- Sprint 1 : besoins (Manager -> RH -> Finance -> DG) -->
        <li class="nav-item dropdown-hover" v-if="peutVoirBesoins">
          <RouterLink class="nav-link" to="/besoins">Besoins</RouterLink>
        </li>
        <li class="nav-item" v-if="peutDemander">
          <RouterLink class="nav-link" to="/besoins/nouveau">Nouveau besoin</RouterLink>
        </li>
        <li class="nav-item" v-if="peutDemander">
          <RouterLink class="nav-link" to="/postes/demande">Demander un poste</RouterLink>
        </li>
        <li class="nav-item" v-if="estRh">
          <RouterLink class="nav-link" to="/postes/proposes">Postes proposés</RouterLink>
        </li>

        <!-- Recrutement (RH) -->
        <li class="nav-item" v-if="estRh">
          <RouterLink class="nav-link" to="/offres">Offres</RouterLink>
        </li>
        <li class="nav-item" v-if="estRh">
          <RouterLink class="nav-link" to="/candidatures">Candidatures</RouterLink>
        </li>
        <li class="nav-item" v-if="estRh">
          <RouterLink class="nav-link" to="/propositions">Propositions</RouterLink>
        </li>

        <!-- Personnel et contrats (RH) -->
        <li class="nav-item" v-if="estRh">
          <RouterLink class="nav-link" to="/personnel">Personnel</RouterLink>
        </li>
        <li class="nav-item" v-if="estRh">
          <RouterLink class="nav-link" to="/contrats/echeances">Échéances</RouterLink>
        </li>

        <!-- P5 : évaluations confiées à l'utilisateur -->
        <li class="nav-item" v-if="user">
          <RouterLink class="nav-link" to="/mes-evaluations">Mes évaluations</RouterLink>
        </li>
      </ul>
      <div class="d-flex align-items-center gap-3">
        <template v-if="user">
          <span class="text-light small">
            <strong>{{ user.login }}</strong>
            <span class="text-warning">({{ user.roles?.join(', ') }})</span>
          </span>
          <button class="btn btn-outline-light btn-sm" type="button" @click="deconnecter">Déconnexion</button>
        </template>
        <RouterLink v-else class="btn btn-outline-light btn-sm" to="/login">Connexion</RouterLink>
      </div>
    </div>
  </nav>

  <RouterView />
</template>
