<script setup>
import { ref, onMounted } from 'vue'
import { getSession } from '@/api/http'

const user = ref(null)
const charge = ref(false)
onMounted(async () => {
  user.value = await getSession()
  charge.value = true
})
</script>

<template>
  <div class="container">
    <div class="card shadow-sm" v-if="charge">
      <div class="card-body">
        <template v-if="user">
          <h4>Bienvenue {{ user.login }} 👋</h4>
          <p class="text-muted mb-0">Rôles : {{ user.roles?.join(', ') || 'aucun' }}</p>
        </template>
        <template v-else>
          <h4>Gestion RH</h4>
          <a class="btn btn-primary" href="/auth/login">Se connecter</a>
        </template>
      </div>
    </div>
  </div>
</template>
