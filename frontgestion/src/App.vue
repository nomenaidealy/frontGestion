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
        <!-- P4 : offres d'emploi (RH) -->
        <li class="nav-item" v-if="aRole('RH')">
          <RouterLink class="nav-link" to="/offres">Offres d'emploi</RouterLink>
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
