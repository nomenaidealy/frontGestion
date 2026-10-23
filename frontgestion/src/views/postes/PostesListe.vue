<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { organisationApi } from '@/api/organisation'
import { besoinsApi } from '@/api/besoins'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Icon from '@/components/ui/Icon.vue'
import PosteFormulaire from '@/components/postes/PosteFormulaire.vue'

const route = useRoute()
const router = useRouter()
const { a } = useAuth()
const toast = useToast()

const etat = ref(route.query.etat || 'ACTIF')
const occupation = ref(route.query.occupation || '')
const idUnite = ref(route.query.idUnite ? Number(route.query.idUnite) : null)
const q = ref('')
const unites = ref([])
const postes = ref(null)
const creation = ref(null)

async function charger() {
  postes.value = null
  router.replace({ query: { etat: etat.value, ...(occupation.value && { occupation: occupation.value }), ...(idUnite.value && { idUnite: idUnite.value }) } })
  postes.value = await organisationApi.postes({ etat: etat.value, occupation: occupation.value, idUnite: idUnite.value, q: q.value })
}
let minuteur
watch([etat, occupation, idUnite], charger)
watch(q, () => { clearTimeout(minuteur); minuteur = setTimeout(charger, 300) })
onMounted(async () => { unites.value = await besoinsApi.unites(); charger() })

async function decider(p, decision) {
  try {
    await organisationApi.deciderPoste(p.id, decision)
    toast.ok(decision === 'ACTIF' ? `Poste « ${p.libelle} » validé` : `Poste « ${p.libelle} » refusé`)
    charger()
  } catch (e) { toast.erreur(e) }
}

function nouveau() {
  creation.value = { libelle: '', idMetier: null, idEchelon: null, idUniteOrga: idUnite.value, idSuperieurDirect: null }
}
async function creer() {
  try {
    const p = await organisationApi.creerPoste(creation.value)
    toast.ok(`Poste ${p.code} créé`)
    creation.value = null
    router.push(`/postes/${p.id}`)
  } catch (e) { toast.erreur(e) }
}
</script>

<template>
  <PageHeader titre="Postes" sous-titre="Les postes de l'organisation, leur occupant et leur état.">
    <RouterLink v-if="a('Manager', 'RH')" to="/postes/demande" class="btn btn-light">Demander un poste</RouterLink>
    <button v-if="a('DG')" type="button" class="btn btn-primary" @click="nouveau"><Icon name="plus" /> Créer un poste</button>
  </PageHeader>

  <div class="filters">
    <div class="segment">
      <button type="button" :class="{ on: etat === 'ACTIF' }" @click="etat = 'ACTIF'">Actifs</button>
      <button type="button" :class="{ on: etat === 'PROPOSE' }" @click="etat = 'PROPOSE'">Proposés</button>
      <button type="button" :class="{ on: etat === 'REFUSE' }" @click="etat = 'REFUSE'">Refusés</button>
      <button type="button" :class="{ on: etat === 'SUPPRIME' }" @click="etat = 'SUPPRIME'">Supprimés</button>
    </div>
    <select v-model="occupation" class="form-select form-select-sm w-auto" aria-label="Occupation">
      <option value="">Occupés et vacants</option><option value="LIBRE">Vacants</option><option value="OCCUPE">Occupés</option>
    </select>
    <select v-model="idUnite" class="form-select form-select-sm w-auto" aria-label="Unité">
      <option :value="null">Toutes les unités</option>
      <option v-for="u in unites" :key="u.id" :value="u.id">{{ u.libelle }}</option>
    </select>
    <input v-model="q" type="search" class="form-control form-control-sm search" placeholder="Code, intitulé, métier…" aria-label="Rechercher">
  </div>

  <div v-if="etat === 'PROPOSE'" class="alert alert-info">
    Un poste demandé dans un besoin est validé avec ce besoin. Les autres demandes de poste sont validées ici par la Direction générale.
  </div>

  <section class="panel">
    <Chargement v-if="postes === null" />
    <Vide v-else-if="!postes.length" titre="Aucun poste" texte="Aucun poste ne correspond à ces filtres." />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Poste</th><th>Unité</th><th>Métier</th><th>Occupant</th><th>État</th><th v-if="etat === 'PROPOSE'"></th></tr></thead>
        <tbody>
          <tr v-for="p in postes" :key="p.id" class="cliquable" @click="router.push(`/postes/${p.id}`)">
            <td><span class="cell-main">{{ p.libelle }}</span><span class="cell-sub">{{ p.code }}</span></td>
            <td>{{ p.unite }}<span v-if="p.superieur" class="cell-sub">sous {{ p.superieur }}</span></td>
            <td>{{ p.metier }}<span class="cell-sub">{{ p.categorie }} · {{ p.echelon }}</span></td>
            <td>
              <template v-if="p.occupant">{{ p.occupant }}<span class="cell-sub">{{ p.matricule }}</span></template>
              <Statut v-else-if="p.etat === 'ACTIF'" type="occupation" :valeur="p.statutOccupation" />
              <span v-else class="muted">—</span>
            </td>
            <td><Statut type="poste" :valeur="p.etat" /></td>
            <td v-if="etat === 'PROPOSE'" class="text-end" @click.stop>
              <RouterLink v-if="p.besoinReference" :to="`/besoins/${p.idBesoin}`" class="small">Avec le besoin {{ p.besoinReference }}</RouterLink>
              <div v-else-if="a('DG', 'ADMIN')" class="d-inline-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-danger" @click="decider(p, 'REFUSE')">Refuser</button>
                <button type="button" class="btn btn-sm btn-primary" @click="decider(p, 'ACTIF')">Valider</button>
              </div>
              <span v-else class="small muted">Décision du DG</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Modal v-if="creation" titre="Créer un poste" large @fermer="creation = null">
    <p class="muted small">Le poste est actif tout de suite. Pour qu'un manager le demande, passez plutôt par un besoin.</p>
    <PosteFormulaire v-model="creation" />
    <template #pied>
      <button type="button" class="btn btn-light" @click="creation = null">Annuler</button>
      <button type="button" class="btn btn-primary" @click="creer">Créer le poste</button>
    </template>
  </Modal>
</template>
