<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { adminApi } from '@/api/admin'
import { personnelApi } from '@/api/personnel'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { dateHeure, depuis } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Icon from '@/components/ui/Icon.vue'

const route = useRoute()
const { currentUser } = useAuth()
const toast = useToast()
const statut = ref(route.query.statut || '')
const q = ref('')
const liste = ref(null)
const roles = ref([])
const employes = ref([])
const edition = ref(null)
const form = reactive({})
const erreur = ref('')
const provisoire = ref(null)

async function charger() { liste.value = null; liste.value = await adminApi.utilisateurs({ statut: statut.value, q: q.value }) }
let minuteur
watch(statut, charger)
watch(q, () => { clearTimeout(minuteur); minuteur = setTimeout(charger, 300) })
onMounted(async () => {
  charger()
  roles.value = await adminApi.roles()
  employes.value = await personnelApi.enPoste().catch(() => [])
})

function ouvrir(u) {
  erreur.value = ''
  edition.value = u || {}
  for (const k of Object.keys(form)) delete form[k]
  Object.assign(form, u
    ? { nomComplet: u.nomComplet || '', email: u.email || '', roles: [...u.roles], idEmploye: u.idEmploye }
    : { login: '', nomComplet: '', email: '', motDePasse: '', roles: ['Employe'], idEmploye: null })
}
async function enregistrer() {
  erreur.value = ''
  try {
    if (edition.value.id) await adminApi.modifier(edition.value.id, form)
    else await adminApi.creer(form)
    toast.ok('Compte enregistré')
    edition.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
async function agir(u, action) {
  try {
    if (action === 'activer') { await adminApi.activer(u.id); toast.ok(`Compte ${u.login} activé`) }
    if (action === 'desactiver') { await adminApi.desactiver(u.id); toast.ok(`Compte ${u.login} désactivé`) }
    if (action === 'supprimer') { await adminApi.supprimer(u.id); toast.ok('Inscription supprimée') }
    if (action === 'reinitialiser') provisoire.value = { login: u.login, mdp: (await adminApi.reinitialiser(u.id)).motDePasseProvisoire }
    charger()
  } catch (e) { toast.erreur(e) }
}
</script>

<template>
  <PageHeader titre="Utilisateurs" sous-titre="Comptes d'accès au SIRH : validation des inscriptions, rôles, rattachement à un employé.">
    <button type="button" class="btn btn-primary" @click="ouvrir(null)"><Icon name="plus" /> Créer un compte</button>
  </PageHeader>
  <div class="filters">
    <div class="segment">
      <button v-for="[k, l] in [['', 'Tous'], ['EN_ATTENTE', 'À valider'], ['ACTIF', 'Actifs'], ['DESACTIVE', 'Désactivés']]" :key="k" type="button" :class="{ on: statut === k }" @click="statut = k">{{ l }}</button>
    </div>
    <input v-model="q" type="search" class="form-control form-control-sm search" placeholder="Identifiant, nom, email…" aria-label="Rechercher">
  </div>
  <section class="panel">
    <Chargement v-if="liste === null" />
    <Vide v-else-if="!liste.length" titre="Aucun compte" :texte="statut === 'EN_ATTENTE' ? 'Aucune inscription en attente.' : ''" />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Compte</th><th>Rôles</th><th>Employé</th><th>Dernière connexion</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          <tr v-for="u in liste" :key="u.id">
            <td><span class="cell-main">{{ u.nomComplet || u.login }}</span><span class="cell-sub">{{ u.login }}<template v-if="u.email"> · {{ u.email }}</template></span></td>
            <td><span v-for="r in u.roles" :key="r" class="badge me-1">{{ r }}</span></td>
            <td>{{ u.employe || '—' }}<span v-if="u.poste" class="cell-sub">{{ u.poste }}</span></td>
            <td :title="dateHeure(u.derniereConnexion)">{{ u.derniereConnexion ? depuis(u.derniereConnexion) : 'Jamais' }}</td>
            <td><Statut type="compte" :valeur="u.statut" /></td>
            <td class="text-end nowrap">
              <button v-if="u.statut !== 'ACTIF'" type="button" class="btn btn-sm btn-primary" @click="agir(u, 'activer')">{{ u.statut === 'EN_ATTENTE' ? 'Valider' : 'Réactiver' }}</button>
              <button type="button" class="btn btn-sm btn-light ms-1" @click="ouvrir(u)">Modifier</button>
              <button type="button" class="btn btn-sm btn-light ms-1" @click="agir(u, 'reinitialiser')">Mot de passe</button>
              <button v-if="u.statut === 'ACTIF' && u.id !== currentUser?.id" type="button" class="btn btn-sm btn-link text-danger" @click="agir(u, 'desactiver')">Désactiver</button>
              <button v-if="u.statut === 'EN_ATTENTE' && !u.derniereConnexion" type="button" class="btn btn-sm btn-link text-danger" @click="agir(u, 'supprimer')">Refuser</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Modal v-if="edition" :titre="edition.id ? `Modifier ${edition.login}` : 'Créer un compte'" @fermer="edition = null">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div class="form-grid">
      <template v-if="!edition.id">
        <div><label class="form-label" for="ul">Identifiant</label><input id="ul" v-model="form.login" class="form-control"></div>
        <div><label class="form-label" for="um">Mot de passe initial</label><input id="um" v-model="form.motDePasse" type="password" class="form-control" autocomplete="new-password"></div>
      </template>
      <div><label class="form-label" for="un">Nom complet</label><input id="un" v-model="form.nomComplet" class="form-control"></div>
      <div><label class="form-label" for="ue">Email</label><input id="ue" v-model="form.email" type="email" class="form-control"></div>
      <div class="full">
        <label class="form-label" for="uemp">Employé rattaché <span class="opt">(son poste détermine ce qu'il valide)</span></label>
        <select id="uemp" v-model="form.idEmploye" class="form-select">
          <option :value="null">Aucun</option>
          <option v-for="e in employes" :key="e.id" :value="e.id">{{ e.nom }} {{ e.prenoms }} — {{ e.poste }}</option>
        </select>
      </div>
      <fieldset class="full" style="border:0;padding:0;margin:0">
        <legend class="form-label">Rôles</legend>
        <div class="d-flex flex-wrap gap-3">
          <label v-for="r in roles" :key="r.id" class="form-check"><input v-model="form.roles" type="checkbox" class="form-check-input" :value="r.libelle"> <span class="form-check-label">{{ r.libelle }}</span></label>
        </div>
      </fieldset>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="edition = null">Annuler</button>
      <button type="button" class="btn btn-primary" @click="enregistrer">Enregistrer</button>
    </template>
  </Modal>

  <Modal v-if="provisoire" titre="Mot de passe provisoire" @fermer="provisoire = null">
    <p>Transmettez ce mot de passe à <b>{{ provisoire.login }}</b>. Il ne sera plus affiché ; l'utilisateur pourra le changer depuis son profil.</p>
    <p style="font-size:1.375rem;font-weight:700;letter-spacing:.04em"><code>{{ provisoire.mdp }}</code></p>
    <template #pied><button type="button" class="btn btn-primary" @click="provisoire = null">C'est noté</button></template>
  </Modal>
</template>
