<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NonConnecteError } from '@/api/http'
import { candidaturesRhApi as api, ETATS_CANDIDATURE } from '@/api/candidatures'
import { formatDate } from '@/views/offres/format'
import ListeOffresCandidatures from '@/components/candidatures/ListeOffresCandidatures.vue'
import TableCandidatures from '@/components/candidatures/TableCandidatures.vue'
import DossierCandidat from '@/components/candidatures/DossierCandidat.vue'
import ActionsSelection from '@/components/candidatures/ActionsSelection.vue'
import HistoriqueCandidature from '@/components/candidatures/HistoriqueCandidature.vue'
import AlerteConnexion from '@/components/candidatures/AlerteConnexion.vue'
import { selectionApi } from '@/api/selection'

const route = useRoute()
const router = useRouter()

const offres = ref([])
const candidatures = ref([])
const fiche = ref(null)
const selection = ref(null)    // sprint 2 : évaluations, historique, actions
const errorSelection = ref(null)
const chargement = ref(true)
const chargementListe = ref(false)
const nonConnecte = ref(false)
const error = ref(null)        // erreur bloquante (droits…)
const errorListe = ref(null)
const errorFiche = ref(null)
const panneauFiche = ref(null)

// Sélection gardée dans l'URL : ?offre=1&etat=DEPOSEE&candidature=2
const idOffre = ref(route.query.offre ? Number(route.query.offre) : null)
const etat = ref(route.query.etat ? String(route.query.etat) : '')
const idCandidature = ref(route.query.candidature ? Number(route.query.candidature) : null)

const offreChoisie = computed(() => offres.value.find((o) => o.id === idOffre.value) ?? null)

function majUrl() {
  const query = {}
  if (idOffre.value) query.offre = idOffre.value
  if (etat.value) query.etat = etat.value
  if (idCandidature.value) query.candidature = idCandidature.value
  router.replace({ query })
}

async function chargerCandidatures() {
  if (!idOffre.value) return
  chargementListe.value = true
  try {
    candidatures.value = await api.candidatures(idOffre.value, etat.value || null)
    errorListe.value = null
  } catch (e) {
    if (e instanceof NonConnecteError) nonConnecte.value = true
    else errorListe.value = e.message
    candidatures.value = []
  } finally {
    chargementListe.value = false
  }
}

/** La sélection ne doit pas empêcher d'afficher le dossier : en cas d'erreur, on prévient seulement. */
function sansSelection(e) {
  errorSelection.value = e.message
  return null
}

async function chargerFiche() {
  fiche.value = null
  selection.value = null
  errorSelection.value = null
  errorFiche.value = null
  if (!idCandidature.value) return
  try {
    const [f, s] = await Promise.all([api.fiche(idCandidature.value), selectionApi.dossier(idCandidature.value).catch(sansSelection)])
    fiche.value = f
    selection.value = s
    await nextTick()
    panneauFiche.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (e) {
    errorFiche.value = e.message
  }
}

/** Après une présélection, un refus ou un résultat : dossier, tableau et compteurs à jour. */
async function selectionChangee(nouvelle) {
  selection.value = nouvelle
  fiche.value = { ...fiche.value, etat: nouvelle.etat }
  await chargerCandidatures()
  try {
    offres.value = await api.offres()
  } catch { /* les compteurs se mettront à jour au prochain chargement */ }
}

function choisirOffre(id) {
  if (id === idOffre.value) return
  idOffre.value = id
  idCandidature.value = null
}

function ouvrirAutre(a) {
  idOffre.value = a.idOffre
  etat.value = ''
  idCandidature.value = a.id
}

watch([idOffre, etat], () => { majUrl(); chargerCandidatures() })
watch(idCandidature, () => { majUrl(); chargerFiche() })

onMounted(async () => {
  try {
    offres.value = await api.offres()
    if (!idOffre.value && offres.value.length) {
      idOffre.value = (offres.value.find((o) => o.nbCandidatures > 0) ?? offres.value[0]).id
    } else {
      await chargerCandidatures()
    }
    await chargerFiche()
  } catch (e) {
    if (e instanceof NonConnecteError) nonConnecte.value = true
    else error.value = e.message
  } finally {
    chargement.value = false
  }
})
</script>

<template>
  <div class="container-fluid px-4" style="max-width: 1300px">
    <h4 class="mb-1">Candidatures reçues</h4>
    <p class="text-muted">Consultez les dossiers déposés pour chaque offre d'emploi.</p>

    <div v-if="chargement" class="text-muted">Chargement…</div>

    <AlerteConnexion v-else-if="nonConnecte" message="Vous devez être connecté pour consulter les candidatures." />

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="!offres.length" class="card card-body text-muted text-center">Aucune offre d'emploi pour le moment.</div>

    <div v-else class="row g-4">
      <div class="col-lg-3">
        <ListeOffresCandidatures :offres="offres" :selection="idOffre" @choisir="choisirOffre" />
      </div>

      <div class="col-lg-9">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
          <div>
            <h5 class="mb-0">{{ offreChoisie?.reference }} — {{ offreChoisie?.postes || 'Poste à pourvoir' }}</h5>
            <div class="text-muted small">
              {{ offreChoisie?.unite }}
              <span v-if="offreChoisie?.dateLimiteCandidature"> · date limite {{ formatDate(offreChoisie.dateLimiteCandidature) }}</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <label for="filtre-etat" class="small fw-semibold">État</label>
            <select id="filtre-etat" v-model="etat" class="form-select form-select-sm" style="width: auto">
              <option value="">Tous</option>
              <option v-for="(libelle, code) in ETATS_CANDIDATURE" :key="code" :value="code">{{ libelle }}</option>
            </select>
          </div>
        </div>

        <div v-if="errorListe" class="alert alert-danger">{{ errorListe }}</div>
        <TableCandidatures :candidatures="candidatures" :chargement="chargementListe" :filtre="!!etat"
                           :selection="idCandidature" @ouvrir="idCandidature = $event" />

        <div ref="panneauFiche" style="scroll-margin-top: 16px">
          <div v-if="errorFiche" class="alert alert-danger">{{ errorFiche }}</div>
          <DossierCandidat v-else-if="fiche" :fiche="fiche" @ouvrir-autre="ouvrirAutre">
            <template v-if="selection && (selection.peutPreselectionner || selection.peutRefuser)" #actions>
              <ActionsSelection :id-candidature="fiche.id" :selection="selection" @change="selectionChangee" />
            </template>
            <div v-if="errorSelection" class="alert alert-warning small mt-3 mb-0">Sélection indisponible : {{ errorSelection }}</div>
            <template v-if="selection">
              <hr>
              <HistoriqueCandidature :historique="selection.historique" />
            </template>
          </DossierCandidat>
        </div>
      </div>
    </div>
  </div>
</template>
