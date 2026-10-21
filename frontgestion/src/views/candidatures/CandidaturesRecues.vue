<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NonConnecteError } from '@/api/http'
import { candidaturesRhApi as api, ETATS_CANDIDATURE } from '@/api/candidatures'
import { formatDate } from '@/views/offres/format'
import ListeOffresCandidatures from '@/components/candidatures/ListeOffresCandidatures.vue'
import TableCandidatures from '@/components/candidatures/TableCandidatures.vue'
import DossierCandidat from '@/components/candidatures/DossierCandidat.vue'

const route = useRoute()
const router = useRouter()

const offres = ref([])
const candidatures = ref([])
const fiche = ref(null)
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

async function chargerFiche() {
  fiche.value = null
  errorFiche.value = null
  if (!idCandidature.value) return
  try {
    fiche.value = await api.fiche(idCandidature.value)
    await nextTick()
    panneauFiche.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (e) {
    errorFiche.value = e.message
  }
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

    <div v-else-if="nonConnecte" class="alert alert-warning d-flex align-items-center justify-content-between">
      <span>Vous devez être connecté pour consulter les candidatures.</span>
      <a href="/auth/login" class="btn btn-primary btn-sm">Se connecter</a>
    </div>

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
          <DossierCandidat v-else-if="fiche" :fiche="fiche" @ouvrir-autre="ouvrirAutre" />
        </div>
      </div>
    </div>
  </div>
</template>
