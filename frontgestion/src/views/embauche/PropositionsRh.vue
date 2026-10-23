<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
// P4 – Propositions d'embauche (RH) : candidats retenus à qui proposer, et suivi des propositions envoyées
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { propositionsApi as api, ETAPES_PROPOSITION, montant } from '@/api/propositions'
import { formatDate } from '@/views/offres/format'

const route = useRoute()
const retenues = ref([])
const propositions = ref([])
const filtre = ref('')
const chargement = ref(true)
const erreur = ref(null)
const message = ref(route.query.message || null)

async function charger() {
  chargement.value = true
  try {
    const [r, p] = await Promise.all([api.retenues(), api.liste()])
    retenues.value = r
    propositions.value = p
    erreur.value = null
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}
onMounted(charger)

// Dernière proposition de chaque candidature : on ne propose pas deux fois en parallèle
const derniereParCandidature = computed(() => {
  const m = new Map()
  for (const p of propositions.value) {
    const d = m.get(p.idCandidature)
    if (!d || p.id > d.id) m.set(p.idCandidature, p)
  }
  return m
})
const aProposer = computed(() => retenues.value.map((r) => ({ ...r, derniere: derniereParCandidature.value.get(r.idCandidature) ?? null })))
const peutProposer = (r) => !r.derniere || ['REFUSEE', 'EXPIREE'].includes(r.derniere.etape)

const listeFiltree = computed(() => (filtre.value ? propositions.value.filter((p) => p.etape === filtre.value) : propositions.value))
const nbATraiter = computed(() => propositions.value.filter((p) => p.etape === 'ATTENTE_RH').length)
const etape = (e) => ETAPES_PROPOSITION[e] ?? { libelle: e, classe: 'bg-secondary' }
</script>

<template>
  <div class="container" style="max-width: 1200px">
    <PageHeader titre="Propositions d'embauche" sous-titre="Proposez un poste aux candidats retenus par la sélection, puis suivez leurs réponses." />

    <div v-if="message" class="alert alert-success">{{ message }}</div>
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-if="chargement" class="text-muted">Chargement…</div>

    <template v-else>
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-white fw-semibold">Candidats retenus</div>
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr><th>Candidat</th><th>Offre</th><th>Poste(s)</th><th>Retenu le</th><th>Dernière proposition</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-if="!aProposer.length"><td colspan="6" class="text-center text-muted py-3">Aucun candidat retenu pour le moment.</td></tr>
            <tr v-for="r in aProposer" :key="r.idCandidature">
              <td><strong>{{ r.nom }} {{ r.prenom }}</strong><div class="small text-muted">{{ r.email }}</div></td>
              <td>{{ r.referenceOffre }}</td>
              <td>{{ r.postes }}</td>
              <td>{{ formatDate(r.dateRetenue?.slice(0, 10)) }}</td>
              <td>
                <RouterLink v-if="r.derniere" :to="{ name: 'proposition-fiche', params: { id: r.derniere.id } }">
                  <span class="badge" :class="etape(r.derniere.etape).classe">{{ etape(r.derniere.etape).libelle }}</span>
                </RouterLink>
                <span v-else class="text-muted small">—</span>
              </td>
              <td class="text-end">
                <RouterLink v-if="peutProposer(r)" class="btn btn-primary btn-sm"
                            :to="{ name: 'proposition-nouvelle', query: { candidature: r.idCandidature } }">
                  Faire une proposition
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
        <h5 class="mb-0">Propositions envoyées
          <span v-if="nbATraiter" class="badge bg-warning text-dark ms-1">{{ nbATraiter }} à traiter</span>
        </h5>
        <select v-model="filtre" class="form-select form-select-sm" style="width: auto" aria-label="Filtrer par étape">
          <option value="">Toutes</option>
          <option v-for="(e, code) in ETAPES_PROPOSITION" :key="code" :value="code">{{ e.libelle }}</option>
        </select>
      </div>
      <div class="card shadow-sm">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr><th>Candidat</th><th>Offre / poste</th><th>Salaire</th><th>Envoyée</th><th>Réponse avant</th><th>Étape</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-if="!listeFiltree.length"><td colspan="7" class="text-center text-muted py-3">Aucune proposition.</td></tr>
            <tr v-for="p in listeFiltree" :key="p.id">
              <td><strong>{{ p.nom }} {{ p.prenom }}</strong><div class="small text-muted">{{ p.email }}</div></td>
              <td>{{ p.referenceOffre }}<div class="small text-muted">{{ p.poste }}</div></td>
              <td class="nowrap">{{ p.salaire ?? '—' }}</td>
              <td>{{ formatDate(p.dateEnvoi?.slice(0, 10)) }}</td>
              <td>{{ formatDate(p.dateLimiteReponse) }}</td>
              <td>
                <span class="badge" :class="etape(p.etape).classe">{{ etape(p.etape).libelle }}</span>
                <div v-if="p.nbConditionsRefusees" class="small text-danger">{{ p.nbConditionsRefusees }} condition(s) refusée(s)</div>
              </td>
              <td class="text-end"><RouterLink class="btn btn-outline-secondary btn-sm" :to="{ name: 'proposition-fiche', params: { id: p.id } }">Ouvrir</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
