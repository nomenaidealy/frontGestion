<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AuthCote from './AuthCote.vue'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const identifiant = ref('')
const motDePasse = ref('')
const voir = ref(false)
const erreur = ref('')
const envoi = ref(false)

async function connecter() {
  erreur.value = ''
  if (!identifiant.value.trim() || !motDePasse.value) {
    erreur.value = 'Saisissez votre identifiant et votre mot de passe.'
    return
  }
  envoi.value = true
  try {
    await login(identifiant.value.trim(), motDePasse.value)
    router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch (e) {
    erreur.value = e.message || 'Connexion impossible.'
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div class="auth">
    <AuthCote />
    <section class="auth-form">
      <div>
        <h2 style="font-size:1.5rem">Connexion</h2>
        <p class="muted">Identifiez-vous avec votre compte collaborateur.</p>
        <div v-if="erreur" class="alert alert-danger" role="alert">{{ erreur }}</div>
        <form novalidate @submit.prevent="connecter">
          <div class="mb-3">
            <label class="form-label" for="login">Identifiant</label>
            <input id="login" v-model="identifiant" class="form-control" autocomplete="username" autofocus>
          </div>
          <div class="mb-3">
            <label class="form-label" for="mdp">Mot de passe</label>
            <div class="input-group">
              <input id="mdp" v-model="motDePasse" :type="voir ? 'text' : 'password'" class="form-control" autocomplete="current-password">
              <button type="button" class="btn btn-light" :aria-pressed="voir" @click="voir = !voir">{{ voir ? 'Masquer' : 'Afficher' }}</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg w-100" :disabled="envoi">
            <span v-if="envoi" class="spin" style="border-top-color:#fff"></span> Se connecter
          </button>
        </form>
        <hr>
        <p class="small muted mb-1">Pas encore de compte ?</p>
        <RouterLink to="/inscription" class="btn btn-light w-100">Demander un accès</RouterLink>
        <p class="small muted mt-3 mb-0">Vous cherchez un emploi ? <RouterLink to="/emplois">Voir nos offres</RouterLink></p>
      </div>
    </section>
  </div>
</template>
