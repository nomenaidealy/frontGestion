<script setup>
import { reactive, ref } from 'vue'
import { authApi } from '@/api/auth'
import AuthCote from './AuthCote.vue'

const form = reactive({ nomComplet: '', email: '', matricule: '', login: '', motDePasse: '', confirmation: '' })
const erreur = ref('')
const fait = ref('')
const envoi = ref(false)

function controler() {
  if (!form.nomComplet.trim()) return 'Saisissez votre nom complet.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Saisissez une adresse email valide.'
  if (!/^[a-zA-Z0-9._-]{3,50}$/.test(form.login.trim())) return "L'identifiant fait 3 à 50 caractères : lettres, chiffres, point, tiret."
  if (form.motDePasse.length < 8 || !/[A-Za-z]/.test(form.motDePasse) || !/\d/.test(form.motDePasse))
    return 'Le mot de passe fait au moins 8 caractères, avec une lettre et un chiffre.'
  if (form.motDePasse !== form.confirmation) return 'Les deux mots de passe ne correspondent pas.'
  return ''
}

async function envoyer() {
  erreur.value = controler()
  if (erreur.value) return
  envoi.value = true
  try {
    const r = await authApi.inscription({ ...form, login: form.login.trim(), matricule: form.matricule.trim() || null })
    fait.value = r.message
  } catch (e) {
    erreur.value = e.message
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
        <h2 style="font-size:1.5rem">Demander un accès</h2>
        <template v-if="fait">
          <div class="alert alert-success">{{ fait }}</div>
          <RouterLink to="/login" class="btn btn-primary w-100">Retour à la connexion</RouterLink>
        </template>
        <template v-else>
          <p class="muted">Votre compte sera actif dès qu'un administrateur l'aura validé et vous aura attribué vos droits.</p>
          <div v-if="erreur" class="alert alert-danger" role="alert">{{ erreur }}</div>
          <form novalidate @submit.prevent="envoyer">
            <div class="mb-3">
              <label class="form-label" for="nom">Nom complet</label>
              <input id="nom" v-model="form.nomComplet" class="form-control" autocomplete="name">
            </div>
            <div class="mb-3">
              <label class="form-label" for="email">Email professionnel</label>
              <input id="email" v-model="form.email" type="email" class="form-control" autocomplete="email">
            </div>
            <div class="mb-3">
              <label class="form-label" for="mat">Matricule <span class="opt">(facultatif)</span></label>
              <input id="mat" v-model="form.matricule" class="form-control" placeholder="EMP-2026-012">
              <span class="form-text">Il permet de rattacher le compte à votre fiche employé.</span>
            </div>
            <div class="mb-3">
              <label class="form-label" for="ident">Identifiant</label>
              <input id="ident" v-model="form.login" class="form-control" autocomplete="username" placeholder="prenom.nom">
            </div>
            <div class="form-grid mb-3">
              <div>
                <label class="form-label" for="mdp">Mot de passe</label>
                <input id="mdp" v-model="form.motDePasse" type="password" class="form-control" autocomplete="new-password">
              </div>
              <div>
                <label class="form-label" for="mdp2">Confirmation</label>
                <input id="mdp2" v-model="form.confirmation" type="password" class="form-control" autocomplete="new-password">
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg w-100" :disabled="envoi">Envoyer la demande</button>
          </form>
          <p class="small muted mt-3 mb-0">Déjà un compte ? <RouterLink to="/login">Se connecter</RouterLink></p>
        </template>
      </div>
    </section>
  </div>
</template>
