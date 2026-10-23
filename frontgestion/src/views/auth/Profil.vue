<script setup>
import { onMounted, reactive, ref } from 'vue'
import { authApi } from '@/api/auth'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { dateHeure } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Chargement from '@/components/ui/Chargement.vue'

const toast = useToast()
const { loadSession } = useAuth()
const profil = ref(null)
const form = reactive({ nomComplet: '', email: '' })
const mdp = reactive({ ancien: '', nouveau: '', confirmation: '' })
const erreurMdp = ref('')

onMounted(async () => {
  profil.value = await authApi.profil()
  Object.assign(form, { nomComplet: profil.value.nomComplet || '', email: profil.value.email || '' })
})

async function enregistrer() {
  try {
    profil.value = await authApi.modifierProfil(form)
    await loadSession()
    toast.ok('Profil enregistré')
  } catch (e) { toast.erreur(e) }
}

async function changerMdp() {
  erreurMdp.value = ''
  if (mdp.nouveau !== mdp.confirmation) { erreurMdp.value = 'Les deux nouveaux mots de passe ne correspondent pas.'; return }
  try {
    await authApi.motDePasse(mdp)
    Object.assign(mdp, { ancien: '', nouveau: '', confirmation: '' })
    toast.ok('Mot de passe modifié')
  } catch (e) { erreurMdp.value = e.message }
}
</script>

<template>
  <PageHeader titre="Mon profil" sous-titre="Vos informations de compte et votre mot de passe." />
  <Chargement v-if="!profil" />
  <div v-else class="stack">
    <section class="panel">
      <div class="panel-head"><h2>Compte</h2></div>
      <div class="panel-body">
        <dl class="facts mb-4">
          <div><dt>Identifiant</dt><dd>{{ profil.login }}</dd></div>
          <div><dt>Rôles</dt><dd>{{ profil.roles.join(', ') }}</dd></div>
          <div><dt>Poste</dt><dd>{{ profil.poste || '—' }}</dd></div>
          <div><dt>Matricule</dt><dd>{{ profil.matricule || '—' }}</dd></div>
          <div><dt>Dernière connexion</dt><dd>{{ dateHeure(profil.derniereConnexion) }}</dd></div>
        </dl>
        <form class="form-grid" @submit.prevent="enregistrer">
          <div>
            <label class="form-label" for="nc">Nom complet</label>
            <input id="nc" v-model="form.nomComplet" class="form-control">
          </div>
          <div>
            <label class="form-label" for="em">Email</label>
            <input id="em" v-model="form.email" type="email" class="form-control">
          </div>
          <div class="full form-actions" style="margin-top:0"><button class="btn btn-primary">Enregistrer</button></div>
        </form>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><div><h2>Mot de passe</h2><p>8 caractères au moins, avec une lettre et un chiffre.</p></div></div>
      <div class="panel-body">
        <div v-if="erreurMdp" class="alert alert-danger">{{ erreurMdp }}</div>
        <form class="form-grid" @submit.prevent="changerMdp">
          <div class="full">
            <label class="form-label" for="a">Mot de passe actuel</label>
            <input id="a" v-model="mdp.ancien" type="password" class="form-control" autocomplete="current-password" style="max-width:340px">
          </div>
          <div>
            <label class="form-label" for="n">Nouveau mot de passe</label>
            <input id="n" v-model="mdp.nouveau" type="password" class="form-control" autocomplete="new-password">
          </div>
          <div>
            <label class="form-label" for="c">Confirmation</label>
            <input id="c" v-model="mdp.confirmation" type="password" class="form-control" autocomplete="new-password">
          </div>
          <div class="full form-actions" style="margin-top:0"><button class="btn btn-primary">Changer le mot de passe</button></div>
        </form>
      </div>
    </section>
  </div>
</template>
